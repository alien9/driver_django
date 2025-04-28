from collections import OrderedDict
import logging, fiona, uuid, os, shapely
from django.db import IntegrityError
from dateutil.parser import parse
from fiona.crs import from_epsg
from django.http import HttpResponse, Http404
from shapely.geometry import mapping,MultiPolygon
from shapely import wkt

from rest_framework import viewsets, mixins, status, serializers, renderers
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.exceptions import ParseError
from rest_framework_gis.filters import InBBoxFilter
from django.http import JsonResponse
from django.db import connection
logger = logging.getLogger(__name__)

from grout import exceptions
from grout.models import (Boundary,
                          BoundaryPolygon,
                          Record,
                          RecordType,
                          RecordSchema
                          )
from data.models import Dictionary
from grout.serializers import (BoundarySerializer,
                               BoundaryPolygonSerializer,
                               BoundaryPolygonNoGeomSerializer,
                               RecordSerializer,
                               RecordTypeSerializer,
                               RecordSchemaSerializer)
from grout.filters import (BoundaryFilter,
                           BoundaryPolygonFilter,
                           JsonBFilterBackend,
                           RecordFilter,
                           RecordTypeFilter)

from grout.pagination import OptionalLimitOffsetPagination


class GPKGRenderer(renderers.BaseRenderer):
    media_type = 'application/force-download'
    format = 'gpkg'
    charset = None
    render_style = 'binary'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        print(data)
        fn=f"/tmp/boundary_{uuid.uuid4()}.gpkg"
        if os.path.isfile(fn):
            os.remove(fn)
        sc={}
        for d in data['data_fields']:
            sc[d]='str'
        sc['uuid']='str'
        print(sc)
        with fiona.open(fn, 'w',
            driver='GPKG',
            crs=from_epsg(4326),
            schema= {'geometry': 'MultiPolygon', 'properties': sc},
            layer_name='multipolygons'
            ) as c:
                for r in BoundaryPolygon.objects.filter(boundary_id=data['uuid']):
                    props={}            
                    for d in data['data_fields']:
                        props[d]=str(r.data[d])
                    
                    props['uuid']=str(r.uuid) 
                    multipolygon = wkt.loads(r.geom.wkt)
                    c.write({'properties':props, 'geometry': mapping(multipolygon)})
                c.close()
        with open(fn, 'rb') as fh:
            response = HttpResponse(fh.read(), content_type="application/force-download")
            response['Content-Disposition'] = f"inline; filename=boundary_{data['uuid']}.gpkg"
            return response
        return data


class BoundaryPolygonViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return BoundaryPolygon.objects.all()        

    queryset = BoundaryPolygon.objects.all()
    serializer_class = BoundaryPolygonSerializer
    filter_class = BoundaryPolygonFilter
    pagination_class = OptionalLimitOffsetPagination
    bbox_filter_field = 'geom'
    jsonb_filter_field = 'data'
    geometry_filter_field = 'filter'
    filter_backends = (InBBoxFilter, JsonBFilterBackend, DjangoFilterBackend)

    def get_serializer_class(self):
        if 'nogeom' in self.request.query_params and self.request.query_params['nogeom']:
            return BoundaryPolygonNoGeomSerializer
        return BoundaryPolygonSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer_class()(instance=instance)
        return JsonResponse(serializer.data, safe=False)

class RecordViewSet(viewsets.ModelViewSet):
    queryset = Record.objects.all()
    serializer_class = RecordSerializer
    filter_class = RecordFilter
    bbox_filter_field = 'geom'
    jsonb_filter_field = 'data'
    filter_backends = (InBBoxFilter, JsonBFilterBackend, DjangoFilterBackend)

    def get_queryset(self):
        """
        Validate the input parameters before returning the queryset.
        """
        occurred_min = self.request.query_params.get('occurred_min', None)
        occurred_max = self.request.query_params.get('occurred_max', None)
        # Make sure that occurred_min < occurred_max if both params exist.
        if occurred_min and occurred_max:
            # Parse both dates in order to compare them.
            try:
                min_date = parse(occurred_max)
            except ValueError:
                # The parser could not parse the date string, so raise an error.
                raise exceptions.QueryParameterException('occurred_max',
                                                         exceptions.DATETIME_FORMAT_ERROR)

            try:
                max_date = parse(occurred_max)
            except ValueError:
                raise exceptions.QueryParameterException('occurred_max',
                                                         exceptions.DATETIME_FORMAT_ERROR)

            if occurred_min > occurred_max:
                messages = {
                    'occurred_min': exceptions.MIN_DATE_RANGE_FILTER_ERROR,
                    'occurred_max': exceptions.MAX_DATE_RANGE_FILTER_ERROR
                }
                raise serializers.ValidationError(messages)

        return self.queryset


class RecordTypeViewSet(viewsets.ModelViewSet):
    queryset = RecordType.objects.all()
    serializer_class = RecordTypeSerializer
    filter_class = RecordTypeFilter
    pagination_class = OptionalLimitOffsetPagination
    ordering = ('plural_label',)


class SchemaViewSet(viewsets.GenericViewSet,
                    mixins.ListModelMixin,
                    mixins.CreateModelMixin,
                    mixins.RetrieveModelMixin):  # Schemas are immutable
    """Base ViewSet for viewsets displaying subclasses of SchemaModel"""
    pagination_class = OptionalLimitOffsetPagination


class RecordSchemaViewSet(SchemaViewSet):
    queryset = RecordSchema.objects.all()
    serializer_class = RecordSchemaSerializer
    jsonb_filter_field = 'schema'
    filter_backends = (JsonBFilterBackend, DjangoFilterBackend)

    # N.B. The DRF documentation is misleading; if you include named parameters as
    # shown in the documentation, this will cause list and detail endpoints to
    # throw Serializer errors.
    def get_serializer(self, *args, **kwargs):
        """Override data passed to serializer with incremented version if necessary"""
        if self.action == 'create' and 'data' in kwargs and 'record_type' in kwargs['data']:
            try:
                version = RecordSchema.objects.get(record_type=kwargs['data']['record_type'],
                                                   next_version=None).version + 1
            except RecordSchema.DoesNotExist:
                version = 1
            kwargs['data']['version'] = version
        return super(RecordSchemaViewSet, self).get_serializer(*args, **kwargs)

class BoundaryViewSet(viewsets.ModelViewSet):
    queryset = Boundary.objects.all().order_by('order')
    serializer_class = BoundarySerializer
    filter_class = BoundaryFilter
    pagination_class = OptionalLimitOffsetPagination
    renderer_classes = [renderers.JSONRenderer, GPKGRenderer, renderers.BrowsableAPIRenderer]

    def create(self, request, *args, **kwargs):
        """Overwritten to allow use of semantically important/appropriate status codes for
        informing users about the type of error they've encountered
        """

        try:
            return super(BoundaryViewSet, self).create(request, *args, **kwargs)
        except IntegrityError:
            return Response({'error': 'uniqueness constraint violation'}, status.HTTP_409_CONFLICT)

    @action(detail=True, methods=['get'])
    def geojson(self, request, pk=None):
        """ Print boundary polygons as geojson FeatureCollection

        Pretty non-performant, and geojson responses get large quickly.
        TODO: Consider other solutions

        """
        boundary = self.get_object()
        polygons = boundary.polygons.values()
        serializer = BoundaryPolygonSerializer()
        features = [serializer.to_representation(polygon) for polygon in polygons]
        data = OrderedDict((
            ('type', 'FeatureCollection'),
            ('features', features)
        ))
        return Response(data)

    @action(methods=['get', 'post'], detail=False)
    def mapfile(self, request):

        color=[0,0,0]
        if self.color is not None:
            h=self.color.lstrip('#')
            color=tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
        t=render_to_string('boundary_theme.map', {
            "connection":connection.settings_dict['HOST'],
            "username":connection.settings_dict['USER'],
            "dbname":connection.settings_dict['NAME'],
            "password":connection.settings_dict['PASSWORD'],
            "query":"geom from (select geom, uuid from grout_boundarypolygon where boundary_id='%s')as q using unique uuid using srid=4326" % (self.uuid,),
            "color": "%s %s %s" % (color[0],color[1],color[2]),
        })
        with open("./mapserver/boundary_{boundary_id}_theme_.map" % (self.uuid), "w+") as m:
            m.write(t)
        #query="select geom, uuid from maps.bouundary_polygon
        return JsonResponse({'errors': {'uuid': 'Denied'}},
            status=status.HTTP_200_OK)

class DictionaryViewSet(viewsets.ModelViewSet):
    queryset = Dictionary.objects.all()
    