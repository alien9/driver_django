from rest_framework_gis.filters import GeometryFilter
import json
import re
import django_filters

from django.contrib.gis.geos import GEOSGeometry
from dateutil.parser import parse

from django.core.exceptions import ImproperlyConfigured
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.gdal.error import GDALException
from django.db.models import JSONField
from django.db.models import Q

from rest_framework.exceptions import ParseError, NotFound
from rest_framework.filters import BaseFilterBackend
from rest_framework_gis.filterset import GeoFilterSet
from django.db.models.expressions import RawSQL

from grout import models
from grout.models import Boundary, BoundaryPolygon, Record, RecordType
from grout.exceptions import QueryParameterException, DATETIME_FORMAT_ERROR


# Map custom fields to CharField so that django-filter knows how to handle them.
FILTER_OVERRIDES = {
    JSONField: {
        'filter_class': django_filters.CharFilter
    },
    gis_models.PointField: {
        'filter_class': django_filters.CharFilter
    }
}


class RecordFilter(GeoFilterSet):

    # Custom filter definitions.
    record_type = django_filters.Filter(
        field_name='record_type', method='filter_record_type')
    geom_intersects = django_filters.Filter(
        field_name='geom_intersects', method='filter_polygon')
    polygon = django_filters.Filter(
        field_name='polygon', method='filter_polygon')
    polygon_id = django_filters.Filter(
        field_name='polygon_id', method='filter_polygon_id')
    occurred_min = django_filters.Filter(
        field_name='occurred_min', method='filter_occurred_min')
    occurred_max = django_filters.Filter(
        field_name='occurred_max', method='filter_occurred_max')

    def filter_record_type(self, queryset, field_name, value):
        """ Method filter for records having a desired record type (uuid)

        e.g. /api/records/?record_type=44a51b83-470f-4e3d-b71b-e3770ec79772

        """
        return queryset.filter(schema__record_type=value)

    def filter_polygon(self, queryset, field_name, geojson):
        """ Method filter for arbitrary polygon, sent in as geojson.
        """
        try:
            poly = GEOSGeometry(geojson)
        except GDALException as e:
            raise ParseError('Failed to parse geometry: ' + str(e))

        # In practically all cases, Django's GEOSGeometry object will throw a
        # GDALException when it attempts to parse an invalid GeoJSON object.
        # However, the docs reccommend using the `valid` and `valid_reason`
        # attributes to check the validity of the input geometries. Support
        # both validity checks here.
        if poly.valid:
            return queryset.filter(geom__intersects=poly)
        else:
            raise ParseError(
                'Input polygon must be valid GeoJSON: ' + poly.valid_reason)

    def filter_polygon_id(self, queryset, field_name, poly_uuid):
        """ Method filter for containment within the polygon specified by poly_uuid"""
        if not poly_uuid:
            return queryset
        rrg = re.compile(
            '[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}', re.I)
        if not rrg.match(poly_uuid):
            return queryset
        try:
            return queryset.extra(where=["st_contains((SELECT geom FROM grout_boundarypolygon WHERE uuid='{q}'),geom)='t'".format(q=poly_uuid)])
        except ValueError as e:
            raise ParseError(e)
        except BoundaryPolygon.DoesNotExist as e:
            raise NotFound(e)

    def filter_occurred_min(self, queryset, field_name, value):
        """Add a lower bound for datetime ranges."""
        if not value:
            # Provide a hardcoded minimum date of 1AD.
            min_date = parse('0001-01-01T00:00:00+00:00')
        else:
            try:
                min_date = parse(value)
            except ValueError:
                # The parser could not parse the date string, so raise an error.
                raise QueryParameterException(
                    'occurred_min', DATETIME_FORMAT_ERROR)

        if not min_date.tzinfo:
            raise QueryParameterException(
                'occurred_min', DATETIME_FORMAT_ERROR)
        else:
            # In order to accommodate ranges, we only want to remove records where the
            # top of the range is <= the minimum date. For a detailed explanation
            # of why this works, see:
            # https://github.com/azavea/grout/pull/9#discussion_r206903954
            return queryset.filter(occurred_to__gte=min_date)

    def filter_occurred_max(self, queryset, field_name, value):
        """Add an upper bound for datetime ranges."""
        if not value:
            # Provide a hardcoded maximum date of 9999AD.
            max_date = parse('9999-12-31T23:59:59.999999+00:00')
        else:
            try:
                max_date = parse(value)
            except ValueError:
                # The parser could not parse the date string, so raise an error.
                raise QueryParameterException(
                    'occurred_max', DATETIME_FORMAT_ERROR)

        if not max_date.tzinfo:
            raise QueryParameterException(
                'occurred_max', DATETIME_FORMAT_ERROR)
        else:
            # In order to accommodate ranges, we only want to remove records where the
            # bottom of the range is >= the maximum date. For a detailed explanation
            # of why this works, see:
            # https://github.com/azavea/grout/pull/9#discussion_r206903954
            return queryset.filter(occurred_from__lte=max_date)

    class Meta:
        model = Record
        fields = ['archived']
        filter_overrides = FILTER_OVERRIDES


class RecordTypeFilter(django_filters.FilterSet):

    record = django_filters.Filter(
        field_name='record', method='type_for_record')

    def type_for_record(self, queryset, field_name, record_id):
        """ Filter down to only the record type that corresponds to the given record. """
        record_type_id = Record.objects.filter(pk=record_id).values_list(
            'schema__record_type_id', flat=True).first()
        return queryset.filter(pk=record_type_id)

    class Meta:
        model = RecordType
        fields = ['active', 'label', 'record']


class BoundaryFilter(GeoFilterSet):

    STATUS_SET = {status[0] for status in Boundary.StatusTypes.CHOICES}

    status = django_filters.Filter(
        field_name='status', method='multi_filter_status')

    def multi_filter_status(self, queryset, field_name, value):
        """ Method filter for multiple choice query on status

        e.g. /api/boundary/?status=ERROR,WARNING

        """
       
        statuses = value.split(',')
        statuses = set(statuses) & self.STATUS_SET
        return queryset.filter(status__in=statuses)
    

    class Meta:
        model = Boundary
        fields = ['status']


class BoundaryPolygonFilter(GeoFilterSet):

    boundary = django_filters.Filter(
        field_name='boundary', method='filter_boundary')
    filter = django_filters.Filter(
        field_name='geom', method='filter_by_geometry')
    location = django_filters.Filter(
        field_name='location', method='filter_by_location')
    
    def filter_by_geometry(self, queryset, field_name, value):
        """ Method filter for containment within the polygon specified by poly_uuid"""
        if not value:
            return queryset
        rrg = re.compile(
            '[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}', re.I)
        if not rrg.match(value):
            return queryset
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "select st_ashexewkb(st_buffer(gb.geom, 0.001)) from grout_boundarypolygon gb where gb.uuid = %s", [value])
                row = cursor.fetchone()
            return queryset.filter(geom__within=row[0])
        except ValueError as e:
            raise ParseError(e)
        except BoundaryPolygon.DoesNotExist as e:
            raise NotFound(e)

    # filter = GeometryFilter(field_name='geom', lookup_expr='contains')

    def filter_boundary(self, queryset, field_name, value):
        """ Method filter for boundary polygons having a desired boundary (uuid)

        e.g. /api/boundarypolygons/?boundary=44a51b83-470f-4e3d-b71b-e3770ec79772

        """

        return queryset.filter(boundary=value)
    
    def filter_by_location(self, queryset, field_name, value):
        import logging
        logger = logging.getLogger(__name__)

        logger.warn("LOCTION FILTER CATIVATED")
        logger.warn(value)
        print("fileterrerere")
        pnt=GEOSGeometry(f"SRID=4326;POINT({value})")
        return queryset.filter(geom__contains=pnt)
    
    class Meta:
        model = BoundaryPolygon
        fields = ['data', 'boundary']
        filter_overrides = FILTER_OVERRIDES


class JsonBFilterBackend(BaseFilterBackend):
    """ Generic configurable filter for JsonBField

    Requires the following properties, configured on the view using this filter backend:

    jsonb_filter_field: The name of the django model field to filter against
    NOTE: Currently, there can be at most one jsonb field to filter over. parametrizing
    the fieldnames will allow indefinitely many filtered columns.

    EXAMPLE USAGE: /api/records/?jcontains={"Site": {"DPWH province name": "CAGAYAN"}}
    """

    def filter_queryset(self, request, queryset, view):
        """ Filter by configured jsonb_filters on jsonb_filter_field """
        lookup_name = 'jsonb'
        filter_field = getattr(view, 'jsonb_filter_field', None)
        if not filter_field:
            raise ImproperlyConfigured('JsonBFilterBackend requires property ' +
                                       '`jsonb_filter_field` on view')

        filter_value = request.query_params.get(lookup_name, None)

        if not filter_value:
            return queryset

        filter_key = '{0}__{1}'.format(filter_field, lookup_name)
        try:
            json_data = json.loads(filter_value)
        except ValueError as e:
            raise ParseError(str(e))

        if isinstance(json_data, dict):
            queryset = queryset.filter(Q(**{filter_key: json_data}))
        else:
            raise ParseError('Lookup must be an object')

        return queryset
