import os
import re
import shutil
import uuid
import logging
from django.db import connection
from django.utils.translation import ugettext_lazy as _
from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.gis.gdal import DataSource as GDALDataSource
from django.db.models import JSONField
from django.core.validators import MinLengthValidator
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from ordered_model.models import OrderedModel
from django.core.cache import cache
from rest_framework import serializers
import base64

import jsonschema
import jsonschema.exceptions

from grout.imports.shapefile import (extract_zip_to_temp_dir,
                                     get_shapefiles_in_dir,
                                     make_multipolygon)
from grout.exceptions import (GEOMETRY_TYPE_ERROR, DATETIME_REQUIRED, DATETIME_NOT_PERMITTED,
                              MIN_DATE_RANGE_ERROR, MAX_DATE_RANGE_ERROR, SCHEMA_MISMATCH_ERROR)


class GroutModel(models.Model):
    """
    Base class providing attributes common to all Grout data types.
    """
    uuid = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    class Meta(object):
        abstract = True


class RecordType(GroutModel):
    """
    Store metadata for a class of Records.
    """
    class GeometryType(object):
        POINT = 'point'
        POLYGON = 'polygon'
        MULTIPOLYGON = 'multipolygon'
        LINESTRING = 'linestring'
        NONE = 'none'
        CHOICES = (
            (POINT, 'Point'),
            (POLYGON, 'Polygon'),
            (MULTIPOLYGON, 'MultiPolygon'),
            (LINESTRING, 'LineString'),
            (NONE, 'None'),
        )

    label = models.CharField(max_length=64)
    plural_label = models.CharField(max_length=64)
    description = models.TextField(blank=True, null=True)
    active = models.BooleanField(default=True)
    geometry_type = models.CharField(max_length=12,
                                     choices=GeometryType.CHOICES,
                                     default=GeometryType.POINT)
    temporal = models.BooleanField(default=True)

    def get_current_schema(self):
        schemas = self.schemas.order_by('-version')
        return schemas[0] if len(schemas) > 0 else None

    def __unicode__(self):
        return self.label

    def __str__(self):
        return self.label


class RecordSchema(GroutModel):
    """
    A flexible schema describing the data contained by a Record.
    """
    version = models.PositiveIntegerField()
    schema = JSONField()
    next_version = models.OneToOneField('self',
                                        related_name='previous_version',
                                        null=True,
                                        editable=False, on_delete=models.CASCADE)
    record_type = models.ForeignKey('RecordType',
                                    related_name='schemas',
                                    on_delete=models.CASCADE)

    class Meta(object):
        unique_together = (('record_type', 'version'),)
        ordering = ('record_type', '-version',)
    # def __unicode__(self):
    #    return "%s %s" % (self.record_type.label, self.version)

    def __str__(self):
        return "%s %s" % (self.record_type.label, self.version)

    def validate_json(self, json_dict):
        """Validates a JSON-like dictionary against this object's schema

        :param json_dict: Python dict representing json to be validated against self.schema
        :return: None if validation succeeds; jsonschema.exceptions.ValidationError if failure
                 (or jsonschema.exceptions.SchemaError if the schema is invalid)
        """
        logging.error(self.schema)
        return jsonschema.validate(json_dict, self.schema)

    @classmethod
    def validate_schema(self, schema):
        """Validates that this object's schema is a valid JSON-Schema schema
        :param schema: Python dict representing json schema that should be checked
        :return: None if schema validates; raises jsonschema.exceptions.SchemaError
            if schema is invalid
        """
        jsonschema.Draft4Validator.check_schema(schema)

    def save(self, *args, **kwargs):
        if self.record_type is not None:
            self.schema["record_type"] = str(self.record_type.uuid)
        from data.tasks.update_dictionaries import update_dictionaries
        update_dictionaries.delay()

        super(RecordSchema, self).save(*args, **kwargs)
        # from data.tasks import create_indexes
        # create_indexes.delay()


class Record(GroutModel):
    """
    An entity in the database. An entry of a given RecordType, following a
    schema defined by a certain RecordSchema.
    """
    schema = models.ForeignKey('RecordSchema', on_delete=models.CASCADE)
    data = JSONField(blank=True)  # `blank` lets us store empty dicts ({}).
    archived = models.BooleanField(default=False)
    occurred_from = models.DateTimeField(null=True, blank=True)
    occurred_to = models.DateTimeField(null=True, blank=True)
    geom = models.GeometryField(
        srid=settings.GROUT['SRID'], null=True, blank=True)
    location_text = models.CharField(max_length=200, null=True, blank=True)

    class Meta(object):
        ordering = ('-created',)

    def clean_geom(self):
        """
        Validate that the geometry of a new Record matches the geometry_type
        of its associated RecordType.

        :return: None if schema validates; otherwise, returns an error dict in the
                 format {'geom': '<error message>'}
        """
        expected_geotype = self.schema.record_type.get_geometry_type_display()

        if self.geom:
            incoming_geotype = self.geom.geom_type
        else:
            incoming_geotype = 'None'

        if incoming_geotype != expected_geotype:
            return {'geom': GEOMETRY_TYPE_ERROR.format(incoming=incoming_geotype,
                                                       expected=expected_geotype,
                                                       uuid=self.schema.record_type.uuid)}
        else:
            return None

    def clean_datetime(self):
        """
        Validate that the values for `occurred_from` and `occurred_to` match
        the `temporal` setting of the parent Record type and are syntactically
        valid.

        :return: None if the fields validate; otherwise, returns an error dict in the
                 format {'occurred_from': '<error_message>', 'occurred_to': '<error_message>'}
        """
        errors = {}
        datetime_required = self.schema.record_type.temporal

        if datetime_required:
            if self.occurred_from is None or self.occurred_to is None:
                # `occurred_from` and `occurred_to` must be present on a temporal
                # Record.
                if self.occurred_from is None:
                    errors['occurred_from'] = DATETIME_REQUIRED.format(
                        uuid=self.schema.record_type.uuid
                    )
                if self.occurred_to is None:
                    errors['occurred_to'] = DATETIME_REQUIRED.format(
                        uuid=self.schema.record_type.uuid
                    )
            else:
                # `occurred_from` cannot be a later date than `occurred_to`.
                # Since by the time that this method is called the values are
                # already attributes on the model, and since we've already
                # confirmed that neither value is null, we can assume for the
                # purposes of comparison that the values are datetime objects.
                if self.occurred_from > self.occurred_to:
                    errors['occurred_from'] = MIN_DATE_RANGE_ERROR
                    errors['occurred_to'] = MAX_DATE_RANGE_ERROR
        else:
            if self.occurred_from is not None:
                errors['occurred_from'] = DATETIME_NOT_PERMITTED.format(
                    uuid=self.schema.record_type.uuid
                )
            if self.occurred_to is not None:
                errors['occurred_to'] = DATETIME_NOT_PERMITTED.format(
                    uuid=self.schema.record_type.uuid
                )

        if errors.keys():
            return errors
        else:
            return None

    def clean_data(self):
        """
        Validate that the JSON represented by the `data` field matches the
        schema for this Record.

        :return: None if the schema validates; otherwise, returns an error dict
                 in the format {'data': '<error_message'}
        """
        try:
            return self.schema.validate_json(self.data)
        except jsonschema.exceptions.ValidationError as e:
            return {
                "data": _("Schema validation failed for ")+_(self.schema.record_type.label)+": " + f"{e.message}"
            }

    def clean(self):
        """
        Provide custom field validation for this model.
        """
        errors = {}

        # Make sure that incoming geometry matches the geometry_type of the
        # RecordType for this Record.
        geom_error = self.clean_geom()
        if geom_error:
            errors.update(geom_error)

        # Make sure that incoming datetime information matches the `temporal`
        # flag on the RecordType for this Record.
        datetime_error = self.clean_datetime()
        if datetime_error:
            errors.update(datetime_error)

        # Make sure that the incoming JSON data matches the RecordSchema
        # for this Record.
        schema_error = self.clean_data()
        if schema_error:
            errors.update(schema_error)

        if errors.keys():
            # Raise a DRF ValidationError instead of a Django Core validation
            # error, since this exception needs to get handled by the serializer.
            raise serializers.ValidationError(errors)

    def save_pictures(self):
        if not os.path.isdir(os.path.join(settings.MEDIA_ROOT, "record_images")):
            os.mkdir(os.path.join(settings.MEDIA_ROOT, "record_images"))
        for table in self.schema.schema['definitions'].keys():
            for field in self.schema.schema['definitions'][table]['properties']:
                if 'fieldType' in self.schema.schema['definitions'][table]['properties'][field]:
                    if self.schema.schema['definitions'][table]['properties'][field]['fieldType'] == 'image':
                        if not self.schema.schema['definitions'][table]['multiple']:
                            if field in self.data[table]:
                                if re.match('^data:image.*', self.data[table][field]):
                                    filename = os.path.join(
                                        settings.MEDIA_ROOT, "record_images", f"{uuid.uuid4()}.jpg")
                                    with open(filename, "wb") as media:
                                        media.write(base64.decodebytes(str.encode(
                                            re.sub('data:image.*,', '', self.data[table][field]))))
                                        media.close()
                                        self.data[table][field] = f"/{filename}"
                        else:
                            for i in range(len(self.data[table])):
                                if field in self.data[table][i]:
                                    if re.match('^data:image.*', self.data[table][i][field]):
                                        filename = os.path.join(
                                            settings.MEDIA_ROOT, "record_images", f"{uuid.uuid4()}.jpg")
                                        with open(filename, "wb") as media:
                                            media.write(base64.decodebytes(str.encode(
                                                re.sub('data:image.*,', '', self.data[table][i][field]))))
                                            media.close()
                                            self.data[table][i][field] = f"/{filename}"

    def save(self, *args, **kwargs):
        """
        Extend the model's save method to run custom field validators.
        """
        self.clean()
        self.save_pictures()
        return super(Record, self).save(*args, **kwargs)


class Imported(GroutModel):
    class Meta(object):
        abstract = True

    class StatusTypes(object):
        PENDING = 'PENDING'
        PROCESSING = 'PROCESSING'
        ERROR = 'ERROR'
        WARNING = 'WARNING'
        COMPLETE = 'COMPLETE'
        CHOICES = (
            (PENDING, 'Pending'),
            (PROCESSING, 'Processing'),
            (WARNING, 'Warning'),
            (ERROR, 'Error'),
            (COMPLETE, 'Complete'),
        )

    status = models.CharField(max_length=10,
                              choices=StatusTypes.CHOICES,
                              default=StatusTypes.PENDING)
    label = models.CharField(max_length=128, validators=[
                             MinLengthValidator(3)])
    # Store any valid css color string
    color = models.CharField(max_length=64, default='blue')
    display_field = models.CharField(max_length=10, blank=True, null=True)
    data_fields = JSONField(blank=True, null=True)
    errors = JSONField(blank=True, null=True)
    source_file = models.FileField(upload_to='boundaries/%Y/%m/%d')

    def get_display_field(self):
        if self.display_field is not None:
            return self.display_field

    def __unicode__(self):
        return self.label

    def __str__(self):
        return self.label


class Boundary(Imported, OrderedModel):
    """ MultiPolygon objects which contain related geometries for filtering/querying """
    class Meta(OrderedModel.Meta):
        verbose_name_plural = _("Boundaries")
        verbose_name = _('Boundary')
    plural_label = models.CharField(max_length=128)

    def load_shapefile(self):
        """ Validate the shapefile saved on disk and load into db """
        self.status = self.StatusTypes.PROCESSING
        self.save()
        if not self.source_file:
            return
        temp_dir = None
        try:
            logging.info("extracting the shapefile")
            temp_dir = extract_zip_to_temp_dir(self.source_file)
            shapefiles = get_shapefiles_in_dir(temp_dir)
            if len(shapefiles) != 1:
                raise ValueError('Exactly one shapefile (.shp) required')

            shapefile_path = os.path.join(temp_dir, shapefiles[0])
            shape_datasource = GDALDataSource(shapefile_path)
            if len(shape_datasource) > 1:
                raise ValueError('Shapefile must have exactly one layer')

            boundary_layer = shape_datasource[0]
            if boundary_layer.srs is None:
                raise ValueError('Shapefile must include a .prj file')
            self.data_fields = boundary_layer.fields
            for feature in boundary_layer:
                feature.geom.transform(settings.GROUT['SRID'])
                geometry = make_multipolygon(feature.geom)
                data = {field: feature.get(field)
                        for field in self.data_fields}
                self.polygons.create(geom=geometry, data=data)

            self.status = self.StatusTypes.COMPLETE
            self.save()
        except Exception as e:
            if self.errors is None:
                self.errors = {}
            self.errors['message'] = str(e)
            # Relabel geography to allow saving a valid shapefile in this namespace
            self.label = self.label + '_' + str(uuid.uuid4())
            self.status = self.StatusTypes.ERROR
            self.save()
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)

    def save(self, *args, **kwargs):
        from data.models import Dictionary
        for d in Dictionary.objects.all():
            cache.delete(f"boundary_names_{d.language_code}")
        from data.tasks.update_dictionaries import update_dictionaries
        update_dictionaries.delay()
        super(Boundary, self).save(*args, **kwargs)

    def write_mapfile(self):
        color = [0, 0, 0]
        if self.color is not None:
            h = self.color.lstrip('#')
            color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
        t = render_to_string('boundary.map', {
            "connection": connection.settings_dict['HOST'],
            "username": connection.settings_dict['USER'],
            "dbname": connection.settings_dict['NAME'],
            "password": connection.settings_dict['PASSWORD'],
            "query": "geom from (select geom, uuid, data->'%s' as label from grout_boundarypolygon where st_intersects(geom, !BOX!) AND boundary_id='%s')as q using unique uuid using srid=4326" % (self.get_display_field(), self.uuid,),
            "color": "%s %s %s" % (color[0], color[1], color[2]),
        })
        with open("./mapserver/boundary_%s.map" % (self.uuid), "w+") as m:
            m.write(t)


@receiver(post_save, sender=Boundary, dispatch_uid="create_boundary")
def post_create(sender, instance, created, **kwargs):
    if created:
        instance.load_shapefile()
    # create mapserver file
    instance.write_mapfile()


class BoundaryPolygon(GroutModel):
    """ Individual boundaries and associated data for each geom in a BoundaryUpload """
    class Meta:
        verbose_name_plural = _("Boundary Polygons")
        verbose_name = _('Boundary Polygon')
    boundary = models.ForeignKey('Boundary',
                                 related_name='polygons',
                                 null=True,
                                 on_delete=models.CASCADE)
    data = JSONField()
    geom = models.MultiPolygonField(srid=settings.GROUT['SRID'])
