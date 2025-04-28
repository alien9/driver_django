from django.conf import settings
from django.contrib.gis.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from grout.models import GroutModel, Imported
from django.utils.translation import ugettext_lazy as _
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import JSONField
from grout.imports.shapefile import (extract_zip_to_temp_dir,
                                     get_shapefiles_in_dir,
                                     make_linestring)
from django.contrib.gis.gdal import DataSource as GDALDataSource
import logging,shutil,uuid,os, subprocess
from django.db import connection
from django.contrib.postgres.fields import HStoreField
from django.db.models.signals import pre_save, post_save
from django.db.models import Q
from django.template.loader import render_to_string

class RoadMap(Imported):
    class Meta:
        verbose_name_plural = _("Road Maps")
        verbose_name = _('Road Map')
        
    def write_mapfile(self):
        t=render_to_string('roads.map', {
            "connection":connection.settings_dict['HOST'],
            "username":connection.settings_dict['USER'],
            "password":connection.settings_dict['PASSWORD'],
            "dbname":connection.settings_dict['NAME'],
            "roadmap_id":  self.uuid,
        })
        with open("./mapserver/roadmap_%s.map" % (self.uuid), "w+") as m:
            m.write(t)
        
    def load_shapefile(self):
        """ Validate the shapefile saved on disk and load into db """
        self.status = self.StatusTypes.PROCESSING
        self.save()
        logging.info("starting")
        try:
            logging.info("extracting the shapefile")
            temp_dir = extract_zip_to_temp_dir(self.source_file)
            shapefiles = get_shapefiles_in_dir(temp_dir)
            if len(shapefiles) != 1:
                raise ValueError('Exactly one shapefile (.shp) required')

            shapefile_path = os.path.join(temp_dir, shapefiles[0])
            sql_path = os.path.join(temp_dir, "temp.sql")
            shape_datasource = GDALDataSource(shapefile_path)
            if len(shape_datasource) > 1:
                raise ValueError('Shapefile must have exactly one layer')

            boundary_layer = shape_datasource[0]
            if boundary_layer.srs is None:
                raise ValueError('Shapefile must include a .prj file')
            self.data_fields = boundary_layer.fields
            srid=boundary_layer.srs.attr_value('AUTHORITY',1)
            sql_file = open(sql_path, 'w+') 
            cmd = [ "shp2pgsql", "-s", srid, "-g", "geom", "-I", shapefile_path, "temp_table"]
            e=subprocess.run(cmd, stdout=sql_file).stdout
            with connection.cursor() as cursor:
                cursor.execute("drop table if exists temp_table;")
                j=0
                k=0
                with open(sql_path, 'r') as reader:
                    sql=""
                    for line in reader:
                        sql+=line.strip()
                        if sql[len(sql)-1]==";" and j>10000:
                            cursor.execute(sql)
                            sql=""
                            j=0
                        j+=1
                        k+=1
                    if len(sql):
                        cursor.execute(sql)
                cursor.execute("INSERT INTO public.black_spots_road(\
	uuid, created, modified, data, geom, roadmap_id) \
	select uuid_generate_v1(), now(), now(), row_to_json(temp_table), st_geometryn(temp_table.geom,1), %s from temp_table",(self.uuid,))
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
            shutil.rmtree(temp_dir, ignore_errors=True)

@receiver(post_save, sender=RoadMap, dispatch_uid="create_roadmap")
def post_create(sender, instance, created, **kwargs):
    if created:
        instance.load_shapefile()

@receiver(post_save, sender=RoadMap, dispatch_uid="save_roadmap")
def post_save_roadmap(sender, instance, created, **kwargs):
    from data.tasks import generate_roads_index
    from black_spots.tasks import generate_roadmap
    generate_roads_index.delay(instance.uuid)
    #generate_roadmap.delay(instance.uuid)
    

class Road(GroutModel):
    roadmap = models.ForeignKey('RoadMap',
                                    related_name='roads',
                                    null=True,
                                    on_delete=models.CASCADE)
    data = JSONField()
    name = models.TextField(max_length=100,null=True)
    geom = models.LineStringField(srid=settings.GROUT['SRID'])



class BlackSpot(GroutModel):
    """A black spot -- an area where there is an historical/statistical
    concentration of records
    """

    #: Buffered road segment polygon where black spot analysis is performed
    geom = models.PolygonField(srid=settings.GROUT['SRID'])
    the_geom = models.LineStringField(srid=settings.GROUT['SRID'], null=True)

    #: Number that determines the severity of this black spot. May be used for color-coding on map.
    severity_score = models.FloatField()

    #: Number of records accounted for in the polygon while analyzing
    num_records = models.PositiveIntegerField()

    #: Number of severe records accounted for in the polygon while analyzing
    num_severe = models.PositiveIntegerField()

    name = models.TextField(default="", max_length=100)

    #: The set of black spots this belongs to
    black_spot_set = models.ForeignKey('BlackSpotSet', on_delete=models.CASCADE)
    #: The latitude of the black spot's centroid
    @property
    def latitude(self):
        """Gets the latitude of the black spot's centroid"""
        return self.geom.centroid.y

    #: The longitude of the black spot's centroid
    @property
    def longitude(self):
        """Gets the longitude of the black spot's centroid"""
        return self.geom.centroid.x


class BlackSpotSet(GroutModel):
    class Meta:
        verbose_name_plural = _("Critical Spots")
        verbose_name = _('Critical Spots')
    """A grouping of black spots generated at one time"""
    title = models.TextField(max_length=100)
    roadmap = models.ForeignKey('RoadMap', null=True, on_delete=models.CASCADE )
    size = models.IntegerField(default=100)
    #: DateTime when the black spots become effective
    effective_start = models.DateTimeField()

    #: DateTime when the black spots are no longer effective.
    #  Should be null when first inserted.
    effective_end = models.DateTimeField(null=True, blank=True)
    display = models.BooleanField(default=True)
    #: The record type these black spots are associated with
    record_type = models.ForeignKey('grout.RecordType', on_delete=models.PROTECT)
    color = models.CharField(max_length=64, default="#ff0000")
    def write_mapfile(self):
        t=render_to_string('critical.map', {
            "connection":connection.settings_dict['HOST'],
            "username":connection.settings_dict['USER'],
            "password":connection.settings_dict['PASSWORD'],
            "dbname":connection.settings_dict['NAME'],
            "query":"the_geom from (select the_geom, uuid, name, num_records, severity_score from black_spots_blackspot where black_spot_set_id='%s')as q using unique uuid using srid=4326" % (self.uuid,),
            "size": self.size,
        })
        with open("./mapserver/critical_%s.map" % (self.uuid), "w+") as m:
            m.write(t)
@receiver(post_save, sender=BlackSpotSet, dispatch_uid="save_blackspotset")
def post_save_blackspotset(sender, instance, created, **kwargs):
    # create mapserver file
    t=render_to_string('critical.map', {
        "connection":connection.settings_dict['HOST'],
        "username":connection.settings_dict['USER'],
        "password":connection.settings_dict['PASSWORD'],
        "dbname":connection.settings_dict['NAME'],
        "query":"the_geom from (select the_geom, uuid, name, num_records, severity_score from black_spots_blackspot where black_spot_set_id='%s')as q using unique uuid using srid=4326" % (instance.uuid,),
        #"color": "%s %s %s" % (color[0],color[1],color[2]),
    })
    with open("./mapserver/critical_%s.map" % (instance.uuid), "w+") as m:
        m.write(t)
    from data.tasks import geocode_records
    geocode_records.delay(instance.uuid)


class BlackSpotConfig(GroutModel):
    """Holds user-configurable settings for how black spot generation should work"""
    #: Blackspot severity percentile cutoff; segments with forecast severity above this threshold
    #: will be considered blackspots.
    severity_percentile_threshold = models.FloatField(default=0.95,
                                                      validators=[MaxValueValidator(1.0),
                                                                  MinValueValidator(0.0)])


class BlackSpotRecordsFile(GroutModel):
    """Model to track blackspot record csvs"""
    #: Path to csvs
    csv = models.FileField(upload_to='blackspot_records/')


class RoadSegmentsShapefile(GroutModel):
    """Model to track gzipped shapefile for road segments training input"""

    #: Path to gzipped shapefile
    shp_tgz = models.FileField(upload_to='road_segments/')


class BlackSpotTrainingCsv(GroutModel):
    """Model to track blackspot training csvs"""

    #: Path to csvs
    csv = models.FileField(upload_to='training/blackspot/')


class LoadForecastTrainingCsv(GroutModel):
    """Model to track forecast training csvs"""
    #: Path to csvs
    csv = models.FileField(upload_to='training/forecast')
