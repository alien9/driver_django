from rest_framework import viewsets
from rest_framework import mixins as drf_mixins
from rest_framework.response import Response
from django_redis import get_redis_connection
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from proxy.views import proxy_view
from constance import config

from data.models import DriverRecord
from black_spots.models import (
    BlackSpot, BlackSpotSet, BlackSpotConfig, RoadMap)
from black_spots.serializers import (BlackSpotSerializer, BlackSpotSetSerializer,
                                     BlackSpotConfigSerializer, EnforcerAssignmentInputSerializer,
                                     EnforcerAssignmentSerializer, RoadMapSerializer)
from black_spots.filters import (
    BlackSpotFilter, BlackSpotSetFilter, EnforcerAssignmentFilter)
from data.views import build_toddow
from rest_framework.decorators import action
from rest_framework import status
from driver_auth.permissions import (is_admin_or_writer,)
from driver_auth.permissions import IsAdminOrReadOnly
from driver import mixins
import datetime, os
import random
import uuid
from dateutil import rrule
from data.tasks import generate_blackspots
from celery import states
from rest_framework.decorators import api_view
from whoosh.index import open_dir
from whoosh.qparser import QueryParser, FuzzyTermPlugin
from urllib.parse import urlparse, parse_qs


class BlackSpotViewSet(viewsets.ModelViewSet, mixins.GenerateViewsetQuery):
    """ViewSet for black spots"""
    queryset = BlackSpot.objects.all()
    serializer_class = BlackSpotSerializer
    filter_class = BlackSpotFilter
    permission_classes = (IsAdminOrReadOnly, )

    def list(self, request, *args, **kwargs):
        # if tilekey if specified, use to get query
        response = Response(None)
        if ('tilekey' in request.query_params):
            tile_token = request.query_params['tilekey']
            redis_conn = get_redis_connection('default')
            sql = redis_conn.get(tile_token)
            if sql:
                tilekey_queryset = BlackSpot.objects.raw(sql)
                tilekey_serializer = BlackSpotSerializer(
                    tilekey_queryset, many=True)
                tilekey_serializer.data.insert(
                    0, {'count': len(tilekey_serializer.data)})
                response = Response(tilekey_serializer.data)
        else:
            response = super(BlackSpotViewSet, self).list(
                self, request, *args, **kwargs)
        return response


class BlackSpotSetViewSet(viewsets.ModelViewSet):
    """ViewSet for black spot sets"""
    queryset = BlackSpotSet.objects.all()
    serializer_class = BlackSpotSetSerializer
    filter_class = BlackSpotSetFilter
    permission_classes = (IsAdminOrReadOnly, )

    def list(self, request, *args, **kwargs):
        response = super(BlackSpotSetViewSet, self).list(
            self, request, *args, **kwargs)
        # If a polygon is passed as an argument, return a tilekey instead of a BlackSpotSet
        # Store the required SQL to filter Blackspots on that polygon
        if 'polygon' in request.query_params and len(response.data['results']) > 0:
            request.uuid = response.data['results'][0]['uuid']
            query_sql = BlackSpotViewSet().generate_query_sql(request)
            tile_token = uuid.uuid4()
            redis_conn = get_redis_connection('default')
            redis_conn.set(tile_token, query_sql.encode('utf-8'))
            # return tile_token instead of the BlackspotSet uuid
            response = Response(
                {'count': 1, 'results': [{'tilekey': tile_token}]})
        return response

    @action(detail=False, methods=['POST'])
    def calculate(self, request, *args, **kwargs):
        if not is_admin_or_writer(request.user):
            return Response({'success': False, 'taskid': None}, status=status.HTTP_401_UNAUTHORIZED)
        if 'uuid' not in request.POST:
            return Response({'success': False, 'taskid': None}, status=status.HTTP_404_NOT_FOUND)
        uuid = request.POST.get('uuid')
        task = generate_blackspots.delay(uuid, request.user.pk)
        return Response({'success': True, 'taskid': task.id}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['POST'])
    def task(self, request):
        if not is_admin_or_writer(request.user):
            return Response({'success': False, 'taskid': None}, status=status.HTTP_401_UNAUTHORIZED)
        if 'task' not in request.POST:
            return Response({'success': False, 'taskid': None}, status=status.HTTP_404_NOT_FOUND)
        task = request.POST.get('task')
        job_result = generate_blackspots.AsyncResult(task)
        if job_result.state in states.READY_STATES:
            if job_result.state in states.EXCEPTION_STATES:
                e = job_result.get(propagate=False)
                return Response({'status': job_result.state, 'error': str(e)})
            return Response({'status': job_result.state, 'result': "OK"})
        return Response({'status': job_result.state, 'info': job_result.info})


class BlackSpotConfigViewSet(drf_mixins.ListModelMixin, drf_mixins.RetrieveModelMixin,
                             drf_mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """ViewSet for BlackSpot configuration
    The BlackSpotConfig object is designed to be a singleton, so POST and DELETE are disabled.
    """
    serializer_class = BlackSpotConfigSerializer

    def get_queryset(self):
        """Ensure that we always return a single config object"""
        # This is a bit roundabout, but we have to return a queryset rather than an object.
        config = BlackSpotConfig.objects.all().order_by('pk').first()
        if not config:
            BlackSpotConfig.objects.create()
            config = BlackSpotConfig.objects.all().order_by('pk').first()
        return BlackSpotConfig.objects.filter(pk__in=[config.pk])


class EnforcerAssignmentViewSet(drf_mixins.ListModelMixin, viewsets.GenericViewSet):
    """ViewSet for enforcer assignments"""
    # Enforcer assignments do not currently have an associated model in the database, and are
    # instead based direcly on black spots, so this is a list-only ViewSet. This was created
    # as its own ViewSet to make it easier if we ever decide to create a db model for
    # enforcer assignments.

    queryset = BlackSpot.objects.all()
    serializer_class = EnforcerAssignmentSerializer
    filter_class = EnforcerAssignmentFilter
    permission_classes = (IsAdminOrReadOnly, )

    def choose_assignments(self, assignments, num_personnel, shift_start, shift_end):
        """
        Select the assignments according to the supplied parameters
        :param assignments: filtered queryset of assignments (black spots)
        :param num_personnel: number of assignments to choose
        :param shift_start: start dt of the shift
        :param shift_end: end dt of the shift
        """

        # The multiplier used for determining the set of assignments to choose from. The size of
        # the list of possible assignments is determined by multiplying this number by the number of
        # personnel. A higher number will result in a greater variance of assignments among shifts.
        fuzz_factor = 4

        # Create a set of assignments with the highest forecasted severity score to sample from.
        assignments = assignments.order_by(
            '-severity_score')[:num_personnel * fuzz_factor]

        # Specify a random seed based on the shift, so assignments are deterministic during the same
        # shift, yet vary from shift to shift.
        random.seed(hash('{}_{}'.format(shift_start, shift_end)))

        # Return the sampled list of assignments
        if num_personnel < len(assignments):
            return random.sample(assignments, num_personnel)
        return assignments

    def scale_by_toddow(self, assignments, shift_start, shift_end, record_type, geom):
        """
        Scale the expected load forecast (severity score) by the time of day and day of week
        :param assignments: filtered queryset of assignments (black spots)
        :param shift_start: start dt of the shift
        :param shift_end: end dt of the shift
        :record_type: the record type uuid
        :geom: the geometry object used for filtering records in toddow creation
        """

        # Generate the ToDDoW aggregation using the past year of data
        num_days_events = 365
        max_dt = timezone.now()
        min_dt = max_dt - datetime.timedelta(days=num_days_events)
        records = DriverRecord.objects.filter(
            occurred_from__gte=min_dt,
            occurred_to__lte=max_dt,
            schema__record_type_id=record_type
        )
        if geom:
            records = records.filter(geom__intersects=geom)
        toddow = build_toddow(records)

        # Construct an `rrule` for iterating over hours between shift start and shift end.
        # Each of these items will be matched up to the items returned in the toddow aggregation to
        # determine which toddow buckets the shift includes. So we need to ensure that the maximum
        # hours in the range is 7x24 to make sure nothing is double counted.
        max_shift_end = shift_start + datetime.timedelta(hours=7 * 24)
        shift_end = min(shift_end, max_shift_end)
        # If the shift_end falls exactly on on hour mark, don't include that bucket
        if shift_end.second == 0 and shift_end.minute == 0:
            shift_end = shift_end - datetime.timedelta(microseconds=1)
        hour_generator = rrule.rrule(
            rrule.HOURLY, dtstart=shift_start, until=shift_end)

        # Iterate over the ToDDoW items and determine which ones are relevant to this shift
        total_count, in_shift_count = 0, 0
        for item in toddow:
            count = item['count']
            total_count += count
            for hourly_dt in hour_generator:
                if hourly_dt.hour == item['tod'] and hourly_dt.isoweekday() == item['dow']:
                    in_shift_count += count
                    break

        # Use ratio of in_shift_count to total_count as the scaling factor
        if total_count > 0 and in_shift_count > 0:
            scaling_factor = in_shift_count / float(total_count)
        else:
            # If there aren't enough counts to properly determine a scaling factor,
            # base it on the linear number of toddow buckets.
            scaling_factor = len(list(hour_generator)) / (7 * 24.0)

        # Need to divide by 52, since the ToDDoW proportion only represents a weekly aggregation,
        # yet the severity score is a yearly figure.
        scaling_factor /= 52

        # Scale the severity score by the scaling factor
        for assignment in assignments:
            assignment.severity_score *= scaling_factor

        return assignments

    def list(self, request, *args, **kwargs):
        """
        List endpoint for enforcer assignments.
        Required URL parameters:
            - record_type - uuid of the record type
            - num_enforcers - number of enforcer assignments to generate
            - shift_start - start dt of the shift
            - shift_end - end dt of the shift
        Optional URL parameters:
            - polygon - WKT for the polygon to generate enforcer assignments for
            - polygon_id - uuid of the polygon to generate enforcer assignments for

        :param request:  The request object
        """

        input_serializer = EnforcerAssignmentInputSerializer(request)
        num_personnel = input_serializer.num_personnel
        shift_start = input_serializer.shift_start
        shift_end = input_serializer.shift_end
        record_type = input_serializer.record_type
        geom = input_serializer.geom

        # Filter the assignments by supplied parameters, sample them, and scale by ToDDoW
        assignments = self.filter_queryset(self.get_queryset())
        assignments = self.choose_assignments(
            assignments, num_personnel, shift_start, shift_end)
        assignments = self.scale_by_toddow(
            assignments, shift_start, shift_end, record_type, geom)

        output_serializer = self.get_serializer(assignments, many=True)
        return Response(output_serializer.data)

class RoadMapViewSet(drf_mixins.RetrieveModelMixin,viewsets.GenericViewSet):
    serializer_class = RoadMapSerializer
    queryset = RoadMap.objects.all()

    def list(self, request):
        queryset = RoadMap.objects.all()
        serializer = RoadMapSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], detail=True)
    def map(self,request, pk=None):
        if not os.path.exists("./mapserver/roadmap_%s.map" % (pk)):
            queryset = RoadMap.objects.all()
            p=get_object_or_404(queryset, pk=pk)
            p.write_mapfile()
        print(request.query_params)  
        from pyproj import Transformer
        transformer = Transformer.from_crs("EPSG:4326","EPSG:3857")
        print(request.query_params.get("latlong").split(","))
        x,y=transformer.transform(*request.query_params.get("latlong").split(",")) 

        print(x,y)
        """"""
        x0=x-10000
        x1=x+10000
        y0=y-10000
        y1=y+10000
        
        path = f"?map=/etc/mapserver/roadmap_{pk}.map&SERVICE=WMS&\
VERSION=1.1.1&REQUEST=GetMap&LAYERS=roads&STYLES=&SRS=EPSG:3857&\
BBOX={x0},{y0},{x1},{y1}&WIDTH=250&HEIGHT=250&format=image/png"

        print(path)
        return proxy_view(request, "%s/%s" % (config.MAPSERVER, path,))
    
    def retrieve(self, request, pk=None):
        queryset = RoadMap.objects.all()
        map = get_object_or_404(queryset, pk=pk)
        serializer = RoadMapSerializer(map)
        return Response(serializer.data)

    @action(methods=['get'], detail=True)
    def forward(self, request, pk=None):
        ix = open_dir("indexdir/{road}".format(road=pk))
        searcher = ix.searcher()
        parser = QueryParser("name", schema=ix.schema)
        parser.add_plugin(FuzzyTermPlugin())
        qs = parse_qs(request.META['QUERY_STRING'])
        res = []
        if 'q' in qs:
            term = str(qs['q'][0])+'~'
            question = parser.parse(term)
            res = searcher.search(question)
        return JsonResponse([{'lat': r['lat'], 'lon': r['lon'], 'address': {'road': r['name'], 'fullname': r['fullname'], 'id': r['id']}} for r in res], safe=False)
