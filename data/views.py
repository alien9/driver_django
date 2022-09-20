from collections import defaultdict
import json, math, os, re
import logging
import uuid
import calendar
import datetime
import pytz
import hashlib
from constance import config
from dateutil.parser import parse as parse_date
from django.template.defaultfilters import date as template_date
from rest_framework.decorators import api_view
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404,redirect
from celery import states
from django.http import JsonResponse
from django.db.models.sql.datastructures import Join
from django.http import HttpResponse, Http404

from django.conf import settings
from django.db import transaction
from django.db.models import (
    FilteredRelation,
    Case,
    CharField,
    Count,
    DateTimeField,
    IntegerField,
    OuterRef,
    Q,
    Subquery,
    Sum,
    UUIDField,
    Value,
    When,
    F,
    Func
)

from django.db import connection
from django.db.models.functions import Coalesce, Cast
from django.core import serializers
from django_redis import get_redis_connection

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework import renderers, status

from rest_framework_csv import renderers as csv_renderer

from grout.models import RecordSchema, RecordType, BoundaryPolygon, Boundary, Record
from grout.views import (BoundaryPolygonViewSet,
                         RecordViewSet,
                         RecordTypeViewSet,
                         RecordSchemaViewSet,
                         BoundaryViewSet)

from grout.serializers import RecordSchemaSerializer

from driver_auth.permissions import (IsAdminOrReadOnly,
                                     ReadersReadWritersWrite,
                                     IsAdminAndReadOnly,
                                     is_admin_or_writer)
from data.tasks import export_csv, generate_blackspots
from data.models import DriverRecord, SegmentSet, Picture, Dictionary
from black_spots.models import BlackSpotSet
from data.localization.date_utils import (
    hijri_day_range,
    hijri_week_range,
    hijri_month_range,
    hijri_year_range
)

from . import filters
from .models import RecordAuditLogEntry, RecordDuplicate, RecordCostConfig
from .serializers import (DriverRecordSerializer, DetailsReadOnlyRecordSerializer,
                         DetailsReadOnlyRecordSchemaSerializer, RecordAuditLogEntrySerializer,
                         RecordDuplicateSerializer, RecordCostConfigSerializer,
                         DetailsReadOnlyRecordNonPublicSerializer, PictureSerializer, 
                         DictionarySerializer)
#import transformers
from driver import mixins
from functools import reduce
from django.shortcuts import render
from django.contrib.postgres.fields.jsonb import KeyTextTransform
from django.db.models.fields import FloatField
from django.db.models.expressions import RawSQL
from django.views.decorators.csrf import csrf_exempt
from proxy.views import proxy_view


logger = logging.getLogger(__name__)

#DateTimeField.register_lookup(transformers.ISOYearTransform)
#DateTimeField.register_lookup(transformers.WeekTransform)

def index(request):
    return render(request, 'dist/index.html', {"config":config})

def editor(request):
    return render(request, 'schema_editor/dist/index.html', {"config":config})

def dictionary(request, code):
    d = Dictionary.objects.filter(language_code=code)
    if len(d):
        return JsonResponse(d[0].content)
    return JsonResponse({})

def mapillary_callback(request):
    j={"result":"FAIL"}
    if 'code' in request.GET:
        import requests
        client_id=getattr(config, 'MAPILLARY_CLIENT_TOKEN')
        url = 'https://graph.mapillary.com/token'
        payload={
            "grant_type": "authorization_code",
            "code": request.GET.get('code'),
            "client_id": getattr(config, 'MAPILLARY_CLIENT_ID')
        }
        headers = {
            'content-type': 'application/json',
            'Accept-Charset': 'UTF-8',
            "Authorization": "OAuth {secret}".format(secret=getattr(config, 'MAPILLARY_SECRET'))
        }
        r = requests.post(url, data=payload, headers=headers)
        j=r.json()
        config.MAPILLARY_TOKEN=j['access_token']
        d=datetime.datetime.now()+datetime.timedelta(seconds=j['expires_in'])
        config.MAPILLARY_EXPIRES=d
        response=redirect(request.GET.get('state'))
        response.set_cookie('mapillary_auth', j['access_token'])
        return response
    return JsonResponse(j)

@csrf_exempt
def proxy(request):
    remoteurl = "%s:5000%s" % (config.WINDSHAFT, request.path,)
    return proxy_view(request, remoteurl)

@csrf_exempt
def mapserver(request):
    return proxy_view(request, "http://%s%s" % (config.MAPSERVER, request.path,))

@csrf_exempt
def legend(request, layer, mapfile):
    if layer=='theme':
        path="?map=/etc/mapserver/theme_{mapfile}.map&VERSION=1.1.1&LAYERS=theme&mode=legend".format(
            mapfile=mapfile,
        )
        return proxy_view(request, "%s/%s" % (config.MAPSERVER, path,))
    if layer=='critical':
        path="?map=/etc/mapserver/critical_{mapfile}.map&VERSION=1.1.1&LAYERS=critical_legend&mode=legend".format(
            mapfile=mapfile,
        )
        return proxy_view(request, "%s/%s" % (config.MAPSERVER, path,))

@csrf_exempt
def grid(request, geometry, mapfile, layer, z, x, y):
    num_sq=math.pow(2, int(z))
    size_sq=40075016.68557849/num_sq
    x0=-20037508.342789244+int(x)*size_sq
    x1=x0+size_sq
    y0=20037508.342789244-(int(y)+1)*size_sq
    y1=y0+size_sq
    filename="{geometry}_{mapfile}.map".format(geometry=geometry,mapfile=mapfile,)
    if not os.path.exists("./mapserver/%s" % (filename)):
        if geometry=='critical':
            b=BlackSpotSet.objects.get(pk=mapfile)
            b.write_mapfile()
        if geometry=='boundary':
            b=Boundary.objects.get(pk=mapfile)
            b.write_mapfile()
    path="?map=/etc/mapserver/{filename}&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS={layer}&STYLES=&SRS=EPSG:3857&BBOX={x0},{y0},{x1},{y1}&WIDTH=250&HEIGHT=250&type=utfgrid&format=application/json".format(
        filename=filename,
        x0=x0,
        x1=x1,
        y0=y0,
        y1=y1,
        geometry=geometry,
        layer=layer
    )

    return proxy_view(request, "%s/%s" % (config.MAPSERVER, path,))

@csrf_exempt
def maps(request, geometry, mapfile, layer, z, x, y):
    if geometry=='boundary' and not os.path.exists("./mapserver/boundary_%s.map" % (mapfile)):
        b=Boundary.objects.get(pk=mapfile)
        b.write_mapfile()
    if geometry=='critical' and not os.path.exists("./mapserver/critical_%s.map" % (mapfile)):
        b=BlackSpotSet.objects.get(pk=mapfile)
        b.write_mapfile()
    
    path="?map=/etc/mapserver/{geometry}_{mapfile}&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS={layer}&STYLES=&SRS=EPSG:3857&MODE=tile&TILEMODE=gmap&TILE={x}+{y}+{z}&WIDTH=250&HEIGHT=250&format=image/png".format(
        mapfile="%s.map" % mapfile,
        x=x,
        y=y,
        z=z,
        geometry=geometry,
        layer=layer
    )
    print(path)    
    return proxy_view(request, "%s/%s" % (config.MAPSERVER, path,))
 

@api_view(['GET', 'POST', ])
def run_calculate_blackspots(request, uuid):
    
    task = generate_blackspots.delay(uuid, request.user.pk)
    return Response({'success': True, 'taskid': task.id}, status=status.HTTP_201_CREATED)

@api_view(['GET', 'POST', ])
def retrieve_blackspots(request, pk):
    job_result = generate_blackspots.AsyncResult(pk)
    if job_result.state in states.READY_STATES:
        if job_result.state in states.EXCEPTION_STATES:
            e = job_result.get(propagate=False)
            return Response({'status': job_result.state, 'error': str(e)})
        return Response({'status': job_result.state, 'result': "OK"})
    return Response({'status': job_result.state, 'info': job_result.info})

def segment_sets(request):
    s=SegmentSet.objects.all()
    return JsonResponse({"result":[{"id":segment.id, "name":segment.name} for segment in s]})

def download(request, filename):
    file_path = os.path.join('zip', filename)
    if os.path.exists(file_path):
        with open(file_path, 'rb') as fh:
            response = HttpResponse(fh.read(), content_type="application/zip")
            response['Content-Disposition'] = 'inline; filename=' + os.path.basename(file_path)
            return response
    raise Http404

def build_toddow(queryset):
    """
    Builds a toddow object

    :param queryset: Queryset of records
    """
    # Build SQL `case` statement to annotate with the day of week
    dow_case = Case(*[When(occurred_from__week_day=x, then=Value(x))
                      for x in range(1, 8)], output_field=IntegerField())
    # Build SQL `case` statement to annotate with the time of day
    tod_case = Case(*[When(occurred_from__hour=x, then=Value(x))
                      for x in range(24)], output_field=IntegerField())
    annotated_recs = queryset.annotate(dow=dow_case).annotate(tod=tod_case)
    # Voodoo to perform aggregations over `tod` and `dow` combinations
    return (annotated_recs.values('tod', 'dow')
            .order_by('tod', 'dow')
            .annotate(count=Count('tod')))


class DriverRecordViewSet(RecordViewSet, mixins.GenerateViewsetQuery):
    """Override base RecordViewSet from grout to provide aggregation and tiler integration
    """
    permission_classes = (ReadersReadWritersWrite,)
    filter_class = filters.DriverRecordFilter
    queryset = DriverRecord.objects.all()

    # Filter out everything except details for read-only users
    def get_serializer_class(self):
        # check if parameter details_only is set to true, and if so, use details-only serializer
        requested_details_only = False
        details_only_param = self.request.query_params.get('details_only', None)
        if details_only_param == 'True' or details_only_param == 'true':
            requested_details_only = True

        #if is_admin_or_writer(self.request.user):
        if requested_details_only:
            return DetailsReadOnlyRecordNonPublicSerializer
        #else:
        return DriverRecordSerializer
        #return DetailsReadOnlyRecordSerializer
    
    def get_super_queryset(self):
        return super(DriverRecordViewSet, self).get_queryset()

    def get_queryset(self):
        qs = super(DriverRecordViewSet, self).get_queryset()
        if self.get_serializer_class() is DetailsReadOnlyRecordNonPublicSerializer:
            # Add in `created_by` field for user who created the record
            created_by_query = (
                RecordAuditLogEntry.objects.filter(
                    record=OuterRef('pk'),
                    action=RecordAuditLogEntry.ActionTypes.CREATE
                )
                .annotate(
                    # Fall back to username if the user has been deleted
                    email_or_username=Coalesce('user__email', 'username')
                )
                .values('email_or_username')
                .values('username')
                [:1]
            )
            #qs = qs.annotate(created_by=Subquery(created_by_query, output_field=CharField()))
            qs = qs.annotate(created_by=Subquery(created_by_query))
        # Override default model ordering
        return qs.order_by('-occurred_from')

    def get_filtered_queryset(self, request):
        """Return the queryset with the filter backends applied. Handy for aggregations."""
        queryset = self.get_queryset()
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(request, queryset, self)
        return queryset

    # Change auditing
    def add_to_audit_log(self, request, instance, action):
        """Creates a new audit log entry; instance must have an ID"""
        if not instance.pk:
            raise ValueError('Cannot create audit log entries for unsaved model objects')
        if action not in RecordAuditLogEntry.ActionTypes.as_list():
            raise ValueError("{} not one of 'create', 'update', or 'delete'".format(action))
        log = None
        signature = None
        if action == RecordAuditLogEntry.ActionTypes.CREATE:
            log = serializers.serialize(
                'json',
                [
                    DriverRecord.objects.get(pk=instance.pk),
                    Record.objects.get(pk=instance.record_ptr_id)
                ]
            )
            signature = hashlib.md5(log.encode('utf-8')).hexdigest()
        RecordAuditLogEntry.objects.create(
            user=request.user,
            username=request.user.username,
            record=instance,
            record_uuid=str(instance.pk),
            action=action,
            log=log,
            signature=signature
        )

    @transaction.atomic
    def perform_create(self, serializer):
        instance = serializer.save()
        self.add_to_audit_log(self.request, instance, RecordAuditLogEntry.ActionTypes.CREATE)

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.save()
        self.add_to_audit_log(self.request, instance, RecordAuditLogEntry.ActionTypes.UPDATE)

    @transaction.atomic
    def perform_destroy(self, instance):
        self.add_to_audit_log(self.request, instance, RecordAuditLogEntry.ActionTypes.DELETE)
        instance.delete()

    # Views
    def list(self, request, *args, **kwargs):
        # Don't generate a tile key unless the user specifically requests it, to avoid
        # filling up the Redis cache with queries that will never be viewed as tiles
        if ('tilekey' in request.query_params and
                request.query_params['tilekey'] in ['True', 'true']):
            response = Response(dict())
            query_sql = self.generate_query_sql(request)
            tile_token = uuid.uuid4()
            self._cache_tile_sql(tile_token, query_sql)
            response.data['tilekey'] = tile_token
        elif ('mapfile' in request.query_params and
                request.query_params['mapfile'] in ['True', 'true']):
            response = Response(dict())
            recordtype_uuid=request.query_params['record_type']
            s=RecordSchema.objects.filter(record_type=recordtype_uuid).order_by('-version')
            if not len(s):
                #throw an error
                response.data['mapfile'] = None
            else:   
                schema=s[0]
                g=Record.objects.filter(schema=schema)
                
                query_sql = self.generate_mapserver_query_sql(request)
                
                query_sql=query_sql.replace('::bytea', '::geometry')
                query_sql=query_sql.replace('\'\\x', '\'')
                query_sql=query_sql.replace('"', '\\"')

                if 'records_mapfile' in request.session:
                    tile_token = request.session['records_mapfile']
                else:
                    if settings.DEBUG:
                        tile_token="debug"
                    else:
                        tile_token=uuid.uuid4()
                    request.session['records_mapfile']=str(tile_token)
                    request.session.modified = True

                self._cache_tile_sql(tile_token, query_sql)
                print("FONF ")
                print(query_sql)
                query_sql=query_sql.replace(') WHERE (', ') WHERE st_intersects(geom, !BOX!) AND (')
                dbstring=connection.settings_dict['HOST']
                if settings.DEBUG:
                    if hasattr(settings, 'CONTAINER_NAME'):
                        dbstring="database-{container}".format(container=settings.CONTAINER_NAME)
                d="0"
                if settings.DEBUG:
                    d="5"
                t=render_to_string('records.map', {
                    "connection":connection.settings_dict['HOST'],
                    "username":connection.settings_dict['USER'],
                    "password":connection.settings_dict['PASSWORD'],
                    "dbname":connection.settings_dict['NAME'],
                    "query":query_sql,
                    "debug":d,
                })
                with open("./mapserver/records_%s.map" % tile_token, "w+") as m:
                    m.write(t)
                response.data['mapfile'] = tile_token
        else:
            response = super(DriverRecordViewSet, self).list(self, request, *args, **kwargs)
        return response

    def _cache_tile_sql(self, token, sql):
        """Stores a sql string in the common cache so it can be retrieved by Windshaft later"""
        # We need to use a raw Redis connection because the Django cache backend
        # transforms the keys and values before storing them. If the cached data
        # were being read by Django, this transformation would be reversed, but
        # since the stored sql will be parsed by Windshaft / Postgres, we need
        # to store the data exactly as it is.
        redis_conn = get_redis_connection('default')
        redis_conn.set(str(token), sql)

    @action(methods=['get'], detail=False)
    def stepwise(self, request):
        """Return an aggregation counts the occurrence of events per week (per year) between
        two bounding datetimes
        e.g. [{"week":35,"count":13,"year":2015},{"week":43,"count":1,"year":2015}]
        """
        # We'll need to have minimum and maximum dates specified to properly construct our SQL
        try:
            start_date = parse_date(request.query_params['occurred_min'])
            end_date = parse_date(request.query_params['occurred_max'])
        except KeyError:
            raise ParseError("occurred_min and occurred_max must both be provided")
        except ValueError:
            raise ParseError("occurred_min and occurred_max must both be valid dates")

        # The min year can't be after or more than 2000 years before the max year
        year_distance = end_date.year - start_date.year
        if year_distance < 0:
            raise ParseError("occurred_min must be an earlier date than occurred_max")
        if year_distance > 2000:
            raise ParseError("occurred_min and occurred_max must be within 2000 years of one another")

        queryset = self.get_filtered_queryset(request)

        # Build SQL `case` statement to annotate with the year
        isoyear_case = Case(*[When(occurred_from__iso_year=year, then=Value(year))
                              for year in range(start_date.year, end_date.year + 1)],
                            output_field=IntegerField())
        # Build SQL `case` statement to annotate with the day of week
        week_case = Case(*[When(occurred_from__week=week, then=Value(week))
                           for week in range(1, 54)],
                         output_field=IntegerField())

        annotated_recs = queryset.annotate(year=isoyear_case).annotate(week=week_case)

        # Voodoo to perform aggregations over `week` and `year` combinations
        counted = (annotated_recs.values('week', 'year')
                   .order_by('week', 'year')
                   .annotate(count=Count('week')))

        return Response(counted)

    @action(methods=['get'], detail=False)
    def toddow(self, request):
        """ Return aggregations which nicely format the counts for time of day and day of week
        e.g. [{"count":1,"dow":6,"tod":1},{"count":1,"dow":3,"tod":3}]
        """
        queryset = self.get_filtered_queryset(request)
        counted = build_toddow(queryset)
        return Response(counted)

    @action(methods=['get'], detail=False)
    def recent_counts(self, request):
        """ Return the recent record counts for 30, 90, 365 days """
        now = datetime.datetime.now(tz=pytz.timezone(settings.TIME_ZONE))
        qs = self.get_filtered_queryset(request).filter(occurred_from__lte=now)
        durations = {
            'month': 30,
            'quarter': 90,
            'year': 365,
        }

        counts = {label: qs.filter(occurred_from__gte=(now - datetime.timedelta(days=days))).count()
                  for label, days in list(durations.items())}

        return Response(counts)

    @action(methods=['get'], detail=False)
    def costs(self, request):
        """Return the costs for a set of records of a certain type

        This endpoint requires the record_type query parameter. All other query parameters will be
        used to filter the queryset before calculating costs.

        There must be a RecordCostConfig associated with the RecordType passed, otherwise a 404
        will be returned. If there are multiple RecordCostConfigs associated with a RecordType, the
        most recently created one will be used.

        Uses the most recent schema for the RecordType; if this doesn't match the fields in the
        RecordCostConfig associated with the RecordType, an exception may be raised.

        Returns a response of the form:
        {
            total: X,
            subtotals: {
                enum_choice1: A,
                enum_choice2: B,
                ...
            }
        }
        """
        record_type_id = request.query_params.get('record_type', None)
        if not record_type_id:
            raise ParseError(detail="The 'record_type' parameter is required")
        cost_config = (RecordCostConfig.objects.filter(record_type_id=record_type_id)
                       .order_by('-created').first())
        if not cost_config:
            return Response({'record_type': 'No cost configuration found for this record type.'},
                            status=status.HTTP_404_NOT_FOUND)
        schema = RecordType.objects.get(pk=record_type_id).get_current_schema()
        path = cost_config.path
        multiple = self._is_multiple(schema, path)
        numeric = schema.schema['definitions'][path[0]]['properties'][path[2]]['type']=="number"
        if numeric:
            counts_queryset = self.get_filtered_queryset(request)
            res['total_crashes']=counts_queryset.count()
            res=counts_queryset.annotate(
                val=RawSQL("((data->%s->%s)::numeric)", (path[0],path[2]))
            ).aggregate(total=Sum('val'))
            if res['total'] is None:
                res['total']=0.0
            res['prefix']= cost_config.cost_prefix
            res['suffix']= cost_config.cost_suffix
            res['outdated_cost_config']= False
            return Response(res)
        
        choices = self._get_schema_enum_choices(schema, path)
        # `choices` may include user-entered data; to prevent users from entering column names
        # that conflict with existing Record fields, we're going to use each choice's index as an
        # alias instead.
        choice_indices = {str(idx): choice for idx, choice in enumerate(choices)}
        counts_queryset = self.get_filtered_queryset(request)
        total_crashes=counts_queryset.count()
        for idx, choice in list(choice_indices.items()):
            filter_rule = self._make_djsonb_containment_filter(path, choice, multiple)
            # We want a column for each enum choice with a binary 1/0 indication of whether the row
            # in question has that enum choice. This is to support checkbox fields which can have
            # more than one selection from the enum per field. Then we're going to sum those to get
            # aggregate counts for each enum choice.
            choice_case = Case(When(data__jsonb=filter_rule, then=Value(1)), default=Value(0),
                               output_field=IntegerField())
            annotate_params = dict()
            annotate_params[idx] = choice_case
            counts_queryset = counts_queryset.annotate(**annotate_params)
        output_data = {'prefix': cost_config.cost_prefix, 'suffix': cost_config.cost_suffix}
        if total_crashes < 1:  # Short-circuit if no events at all
            output_data.update({'total': 0, 'subtotals': {choice: 0 for choice in choices},
                                'outdated_cost_config': False})
            return Response(output_data)
        # Do the summation
        sum_ops = [Sum(key) for key in list(choice_indices.keys())]
        sum_qs = counts_queryset.values(*list(choice_indices.keys())).aggregate(*sum_ops)
        # sum_qs will now look something like this: {'0__sum': 20, '1__sum': 45, ...}
        # so now we need to slot in the corresponding label from `choices` by pulling the
        # corresponding value out of choices_indices.
        sums = {}
        for key, choice_sum in list(sum_qs.items()):
            index = key.split('_')[0]
            choice = choice_indices[index]
            sums[choice] = choice_sum
        # Multiply sums by per-incident costs to get subtotal costs broken out by type
        subtotals = dict()
        # This is going to be extremely easy for users to break if they update a schema without
        # updating the corresponding cost configuration; if things are out of sync, degrade
        # gracefully by providing zeroes for keys that don't match and set a flag so that the
        # front-end can alert users if needed.
        found_missing_choices = False
        for key, value in list(sums.items()):
            try:
                subtotals[key] = value * int(cost_config.enum_costs[key])
            except KeyError:
                logger.warn('Schema and RecordCostConfig out of sync; %s missing from cost config',
                            key)
                found_missing_choices = True
                subtotals[key] = 0
        total = sum(subtotals.values())
        # Return breakdown costs and sum
        output_data.update({'total': total, 'total_crashes': total_crashes, 'subtotals': subtotals,
                            'outdated_cost_config': found_missing_choices})
        return Response(output_data)

    @action(methods=['get'], detail=False)
    def crosstabs(self, request):
        """Returns a columnar aggregation of event totals; this is essentially a generalized ToDDoW

        Requires the following query parameters:
        - Exactly one row specification parameter chosen from:
            - row_period_type: A time period to use as rows; valid choices are:
                               {'hour', 'day', 'week_day', 'week', 'month', 'year', 'all'}
                               The value 'day' signifies day-of-month
            - row_boundary_id: Id of a Boundary whose BoundaryPolygons should be used as rows
            - row_choices_path: Path components to a schema property whose choices should be used
                                as rows, separated by commas
                                e.g. &row_choices_path=incidentDetails,properties,Collision%20type
                                Note that ONLY properties which have an 'enum' key are valid here.
        - Exactly one column specification parameter chosen from:
            - col_period_type
            - col_boundary_id
            - col_choices_path
            As you might expect, these operate identically to the row_* parameters above, but the
            results are used as columns instead.
        - record_type: The UUID of the record type which should be aggregated
        - calendar: the calendar to use for the report to (Ex: 'gregorian' or 'ummalqura')

        Allows the following query parameters:
        - aggregation_boundary: Id of a Boundary; separate tables will be generated for each
                                BoundaryPolygon associated with the Boundary.
        - relate: Path for the multiple related table to aggregate into counts. If this isn't 
            provided, the method must return the counts of registries for each aggregation.
            When the relate patrameter is provided, the method must count the totals for that 
            related information.
        - all other filter params accepted by the list endpoint; these will filter the set of
            records before any aggregation is applied. This may result in some rows / columns /
            tables having zero records.

        Note that the tables are sparse: rows will only appear in 'data' and 'row_totals',
        and columns will only appear in rows, if there are values returned by the query.
        'row_labels' and 'col_labels', however, are complete and in order.

        Response format:
        {
            "row_labels": [
                { "key": "row_key1", "label": "row_label1"},
                ...
            ],
            "col_labels": [
                { "key": "col_key1", "label": "col_label1"},
                ...
            ],
            "table_labels": {
                "table_key1": "table_label1",
                // This will be empty if aggregation_boundary is not provided
            },
            "tables": [
                {
                    "tablekey": "table_key1",
                    "data": {
                        {
                            "row_key1": {
                                "col_key1": N,
                                "col_key3": N,
                            },
                        },
                        ...
                    },
                    "row_totals": {
                        {
                            "row_key1": N,
                            "row_key3": N,
                    }
                },
                ...
            ]
        }
        """
        valid_row_params = set(['row_period_type', 'row_boundary_id', 'row_choices_path'])
        valid_col_params = set(['col_period_type', 'col_boundary_id', 'col_choices_path'])
        # Validate there's exactly one row_* and one col_* parameter
        row_params = set(request.query_params) & valid_row_params
        col_params = set(request.query_params) & valid_col_params
        if len(row_params) != 1 or len(col_params) != 1:
            raise ParseError(detail='Exactly one col_* and row_* parameter required; options are {}'
                                    .format(list(valid_row_params | valid_col_params)))

        # Get queryset, pre-filtered based on other params
        queryset = self.get_filtered_queryset(request)

        # Pass parameters to case-statement generators
        row_param = row_params.pop()  # Guaranteed to be just one at this point
        col_param = col_params.pop()
        row_multi, row_labels, annotated_qs = self._query_param_to_annotated_tuple(
            row_param, request, queryset, 'row')
        col_multi, col_labels, annotated_qs = self._query_param_to_annotated_tuple(
            col_param, request, annotated_qs, 'col')
        # If aggregation_boundary_id exists, grab the associated BoundaryPolygons.
        tables_boundary = request.query_params.get('aggregation_boundary', None)
        if tables_boundary:
            boundaries = BoundaryPolygon.objects.filter(boundary=tables_boundary)
        else:
            boundaries = None

        # Assemble crosstabs either once or multiple times if there are boundaries
        response = dict(tables=[], table_labels=dict(), row_labels=row_labels,
                        col_labels=col_labels)
        if boundaries:
            # Add table labels
            parent = Boundary.objects.get(pk=tables_boundary)
            response['table_labels'] = {str(poly.pk): poly.data[parent.display_field]
                                        for poly in boundaries}
            # Filter by polygon for counting
            for poly in boundaries:
                table = self._fill_table(
                    annotated_qs.filter(geom__within=poly.geom),
                    row_multi, row_labels, col_multi, col_labels)
                table['tablekey'] = poly.pk
                response['tables'].append(table)
        else:
            response['tables'].append(self._fill_table(
                annotated_qs, row_multi, row_labels, col_multi, col_labels))
        return Response(response)

    def thematic(self, request, b): # b is a blackspotset
        if b.color is not None:
            h=b.color.lstrip('#')
            color=tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
        cor=reduce(lambda a,b: "{a} {b}".format(a=a,b=b),color)
        cursor = connection.cursor().cursor
        fq=self.get_filtered_queryset(request).order_by().values('geom')
        sql, params = fq.query.sql_with_params()
        fq = cursor.mogrify(sql, params).decode('utf-8')
        display_field=b.roadmap.display_field
        where=re.search('WHERE (.*)$', fq).group(1)
        query_sql="select r.id, count(*) as c, r.name, r.geom \
         from data_recordsegment r\
            join data_driverrecord_segment dr on dr.recordsegment_id =r.id\
             join data_driverrecord drs on dr.driverrecord_id=drs.record_ptr_id\
             join grout_record on grout_record.uuid=dr.driverrecord_id \
             LEFT JOIN grout_recordschema ON (grout_record.schema_id = grout_recordschema.uuid) \
             where r.size={size} and {where} group by r.id, r.geom, r.name".format(where=where, display_field=display_field, size=b.size)
        #the complete query is set to the mapfile
        
        #execute the small query
        cursor.execute(query_sql)

        query_sql="select r.id, count(*) as c, r.name, r.geom \
         from data_recordsegment r\
            join data_driverrecord_segment dr on dr.recordsegment_id =r.id\
             join data_driverrecord drs on dr.driverrecord_id=drs.record_ptr_id\
             join grout_record on grout_record.uuid=dr.driverrecord_id \
             LEFT JOIN grout_recordschema ON (grout_record.schema_id = grout_recordschema.uuid) \
             where st_intersects(!BOX!, r.geom) AND st_intersects(!BOX!, grout_record.geom) AND r.size={size} and {where} group by r.id, r.geom, r.name".format(where=where, display_field=display_field, size=b.size)
        print(query_sql)

        sample=list(set(map(lambda x: x[1], [r for r in cursor.fetchall()])))
        print(sample)
        #sample=sorted([r for r in cursor.fetchall()], key=lambda a: a[1])

        i=0
        classes=[]
        sample.sort()
        while i<len(sample):
            min=sample[i]
            max=sample[i]
            opacity=round(100*i/len(sample))
            cl={
                'min':min,
                'max':max,
                'color':cor,
                'name':"{min}".format(min=min),
                'opacity':opacity
            }
            classes.append(cl)
            i+=1
        classes_legend=[]
        if len(classes)<=5:
            classes_legend=list(classes)
        else:
            classes_legend.append(classes[0])
            for i in range(1,5):
                classes_legend.append(classes[math.floor(i*len(classes)/5)])
            classes_legend.append(classes[len(classes)-1])
 
        d="0"
        if settings.DEBUG:
            d="5"
        t=render_to_string('critical.map', {
                    "connection":connection.settings_dict['HOST'],
                    "username":connection.settings_dict['USER'],
                    "password":connection.settings_dict['PASSWORD'],
                    "dbname":connection.settings_dict['NAME'],
                    "query":query_sql.replace('"', '\\"'),
                    "classes":classes,
                    "classes_legend":classes_legend,
                    "debug": d,
                })
        if "critical_mapfile_%s" % (b.uuid) in request.session:
            tile_token = request.session["critical_mapfile_%s" % (b.uuid)]
        else:
            if settings.DEBUG:
                tile_token="critical_%s_debug" % (b.uuid)
            else:
                tile_token="%s_%s" % (b.uuid, uuid.uuid4())
            request.session["critical_mapfile_%s" % (b.uuid)]=str(tile_token)
            request.session.modified = True
        dbstring=connection.settings_dict['HOST']
        if settings.DEBUG:
            if hasattr(settings, 'CONTAINER_NAME'):
                dbstring="database-{container}".format(container=settings.CONTAINER_NAME)
        
        with open("./mapserver/critical_%s.map" % (tile_token), "w+") as m:
                    m.write(t)
        return Response({'query':query_sql, 'sample':sample, 'mapfile': tile_token})        

    @action(methods=['get'], detail=False)
    def quantiles(self, request):
        # this is a particular crosstabs request for aggregating by geo, and creating a mapfile
        # the mapfile is indexed by the boundary uuid and the session id.
        blackspotset_uuid=request.query_params.get('critical', None)
        tables_boundary = request.query_params.get('aggregation_boundary', None)
        if (tables_boundary is None or not re.match(r'^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$', tables_boundary, flags=re.IGNORECASE)) and (blackspotset_uuid is None or not re.match(r'^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$', blackspotset_uuid, flags=re.IGNORECASE)):
            return JsonResponse({
                "mapfile":None, "error": "uuid not valid"
            })
        if blackspotset_uuid is not None:
            b=BlackSpotSet.objects.get(pk=blackspotset_uuid)
            return self.thematic(request, b)
        else:
            b=Boundary.objects.get(pk=tables_boundary)
        color=[255,0,0]
        if b.color is not None:
            h=b.color.lstrip('#')
            color=tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

        qset=BoundaryPolygon.objects.filter(boundary_id=tables_boundary).values('uuid','geom')
        cursor = connection.cursor().cursor
        fq=self.get_filtered_queryset(request).order_by().values('geom')
        sql, params = fq.query.sql_with_params()
        fq = cursor.mogrify(sql, params).decode('utf-8')
        sql, params = qset.query.sql_with_params()
        gq = cursor.mogrify(sql, params).decode('utf-8')
        where=reduce((lambda a, b: "%s AND %s" % (a, b)),
            map(
                lambda x: re.search('WHERE (.*)$', x).group(1),
                [fq, gq]
            )
        )
        #the complete query is set to the mapfile
        query_sql='SELECT "grout_boundarypolygon"."geom","grout_boundarypolygon"."uuid", count(*) as c FROM "grout_boundarypolygon" LEFT JOIN "grout_record" on st_contains("grout_boundarypolygon"."geom", "grout_record"."geom")=\'t\'  LEFT JOIN "data_driverrecord" ON ("data_driverrecord"."record_ptr_id" = "grout_record"."uuid") LEFT JOIN "grout_recordschema" ON ("grout_record"."schema_id" = "grout_recordschema"."uuid") WHERE {where} GROUP BY "grout_boundarypolygon"."geom","grout_boundarypolygon"."uuid"'.format(where=where)
        
        #execute the small query
        cursor.execute('SELECT "grout_boundarypolygon"."uuid", case when c.c is null then 0 else c.c end, "grout_boundarypolygon".data->\'{display_field}\' from "grout_boundarypolygon" left join (SELECT "grout_boundarypolygon"."uuid", count(*) as c, "grout_boundarypolygon".data->\'{display_field}\' as name FROM  "grout_boundarypolygon" LEFT JOIN "grout_record" on st_contains("grout_boundarypolygon"."geom", "grout_record"."geom")=\'t\'  LEFT JOIN "data_driverrecord" ON ("data_driverrecord"."record_ptr_id" = "grout_record"."uuid") LEFT JOIN "grout_recordschema" ON ("grout_record"."schema_id" = "grout_recordschema"."uuid") WHERE {where} GROUP BY "grout_boundarypolygon"."uuid") c on c.uuid="grout_boundarypolygon"."uuid" WHERE "grout_boundarypolygon"."boundary_id" = \'{boundary_id}\''.format(where=where, display_field=b.display_field, boundary_id=tables_boundary))
        sample=sorted([r for r in cursor.fetchall()], key=lambda a: a[1])
        chunk=(len(sample)-1)/5.0
        i=0
        classes=[]
        last={'max':-1, 'min':-1}
        print(sample)
        while i<5:
            min=sample[math.floor(i*chunk)][1]
            max=sample[math.ceil((i+1)*chunk)][1]
            cl={
                'min':min,
                'max':max,
                'color':reduce(lambda a,b: "{a} {b}".format(a=a,b=b), map(
                lambda c: 255-round(((255-c)/4)*i),
                color)),
                'name':"{min} ~ {max}".format(max=max,min=min)
            }
            if min!=max and (last['min']!=min or last['max']!=max):
                classes.append(cl)
            last={'max':cl['max'],'min':cl['min']}
            i+=1
        d="0"
        if settings.DEBUG:
            d="5"
        t=render_to_string('boundary_theme.map', {
                    "connection":connection.settings_dict['HOST'],
                    "username":connection.settings_dict['USER'],
                    "password":connection.settings_dict['PASSWORD'],
                    "dbname":connection.settings_dict['NAME'],
                    "query":query_sql.replace('"', '\\"'),
                    "classes":classes,
                    "boundary_id":tables_boundary,
                    "debug": d,
                })
        if "theme_mapfile_%s" % (tables_boundary) in request.session:
            tile_token = request.session["theme_mapfile_%s" % (tables_boundary)]
        else:
            if settings.DEBUG:
                tile_token="theme_%s_debug" % (tables_boundary)
            else:
                tile_token="%s_%s" % (tables_boundary, uuid.uuid4())
            request.session["theme_mapfile_%s" % (tables_boundary)]=str(tile_token)
            request.session.modified = True
        dbstring=connection.settings_dict['HOST']
        if settings.DEBUG:
            if hasattr(settings, 'CONTAINER_NAME'):
                dbstring="database-{container}".format(container=settings.CONTAINER_NAME)
        
        with open("./mapserver/theme_%s.map" % (tile_token), "w+") as m:
                    m.write(t)
        return Response({'query':query_sql, 'sample':sample, 'mapfile': tile_token})
        
    def _fill_table(self, annotated_qs, row_multi, row_labels, col_multi, col_labels):
        """ Fill a nested dictionary with the counts and compute row totals. """

        # The data being returned is a nested dictionary: row label -> col labels = integer count
        
        data = defaultdict(lambda: defaultdict(int))
        if not row_multi and not col_multi:
            # Not in multi-mode: sum rows/columns by a simple count annotation.
            # This is the normal case.
            # Note: order_by is necessary here -- it's what triggers django to do a group by.
            for value in (annotated_qs.values('row', 'col')
                          .order_by('row', 'col')
                          .annotate(count=Count('row'))):
                if value['row'] is not None and value['col'] is not None:
                    data[str(value['row'])][str(value['col'])] = value['count']
        elif row_multi and col_multi:
            # The row and column are in multi-mode, iterate to build up counts.
            # This is a very rare case, since creating a report between two 'multiple' items
            # doesn't seem very useful, at least with the current set of data. We may even end
            # up restricting this via the front-end. But until then, it's been implemented
            # here, and it works, but is on the slow side, since it needs to manually aggregate.
            for record in annotated_qs:
                rd = record.__dict__
                row_ids = [
                    str(label['key'])
                    for label in row_labels
                    if rd['row_{}'.format(label['key'])] > 0
                ]
                col_ids = [
                    str(label['key'])
                    for label in col_labels
                    if rd['col_{}'.format(label['key'])] > 0
                ]
                # Each object has row_* and col_* fields, where a value > 0 indicates presence.
                # Increment the counter for each combination.
                for row_id in row_ids:
                    for col_id in col_ids:
                        data[row_id][col_id] += 1
        else:
            # Either the row or column is a 'multiple' item, but not both.
            # This is a relatively common case and is still very fast since the heavy-lifting
            # is all done within the db.
            if row_multi:
                multi_labels = row_labels
                single_label = 'col'
                multi_prefix = 'row'
            else:
                multi_labels = col_labels
                single_label = 'row'
                multi_prefix = 'col'
            multi_labels = [
                '{}_{}'.format(multi_prefix, str(label['key']))
                for label in multi_labels
            ]
            
            
            # Perform a sum on each of the 'multi' columns, storing the data in a sum_* field
            annotated_qs = (
                annotated_qs.values(single_label, *multi_labels)
                .order_by()
                .annotate(**{'sum_{}'.format(label): Sum(label) for label in multi_labels}))
            # Iterate over each object and accumulate each sum in the proper dictionary position.
            # Each object either has a 'row' and several 'col_*'s or a 'col' and several 'row_*'s.
            # Get the combinations accordingly and accumulate the appropriate stored value.
            for rd in annotated_qs:
                for multi_label in multi_labels:
                    sum_val = rd['sum_{}'.format(multi_label)]
                    rd_row = rd['row'] if 'row' in rd else 'None'
                    rd_col = rd['col'] if 'col' in rd else 'None'
                    if sum_val is not None:
                        if row_multi:
                            data[str(multi_label[4:])][str(rd_col)] += sum_val
                        else:
                            data[str(rd_row)][str(multi_label[4:])] += sum_val
        row_totals = {row: sum(cols.values()) for (row, cols) in list(data.items())}
        return {'data': data, 'row_totals': row_totals}

    def _get_annotated_tuple(self, queryset, annotation_id, case, labels):
        """Helper wrapper for annotating a queryset with a case statement

        Args:
          queryset (QuerySet): The input queryset
          annotation_id (String): 'row' or 'col'
          case (Case): The generated Case statement
          labels (dict<Case, String>): dict mapping Case values to labels

        Returns:
            A 3-tuple of:
              - boolean which specifies whether or not this is a 'multiple' query (always False)
              - dict mapping Case values to labels
              - the newly-annotated queryset
        """
        kwargs = {}
        kwargs[annotation_id] = case
        annotated_qs = queryset.annotate(**kwargs)
        return (False, labels, annotated_qs)

    def _query_param_to_annotated_tuple(self, param, request, queryset, annotation_id):
        """Wrapper to handle getting the params for each case generator because we do it twice. TODO....."""
        try:
            record_type_id = request.query_params['record_type']
        except KeyError:
            raise ParseError(detail="The 'record_type' parameter is required")

        if param.endswith('period_type'):
            query_calendar = request.query_params.get('calendar')
            #period type can be "all"
            if (query_calendar == 'gregorian'):
                return self._get_annotated_tuple(
                    queryset, annotation_id,
                    *self._make_gregorian_period_case(
                        request.query_params[param], request, queryset))
            elif (query_calendar == 'ummalqura'):
                return self._get_annotated_tuple(
                    queryset, annotation_id,
                    *self._make_ummalqura_period_case(
                        request.query_params[param], request, queryset))
        elif param.endswith('boundary_id'):
            return self._get_annotated_tuple(
                queryset, annotation_id, *self._make_boundary_case(request.query_params[param]))
        else:  # 'choices_path'; ensured by parent function
            schema = RecordType.objects.get(pk=record_type_id).get_current_schema()
            path = request.query_params[param].split(',')
            relate=request.query_params.get('relate')
            return self._get_multiple_choices_annotated_tuple(
                queryset, annotation_id, schema, path, relate)

    def _get_day_label(self, week_day_index):
        """Constructs a day translation label string given a week day index

        Args:
            week_day_index (int): Django `week_day` property (1-indexed, starting with Sunday)

        Returns:
            A string representing the day translation label
        """
        # week_day is 1-indexed and starts with Sunday, whereas day_name
        # is 0-indexed and starts with Monday, so we need to map indices as follows:
        # 1,2,3,4,5,6,7 -> 6,0,1,2,3,4,5 for Sunday through Saturday
        return 'DAY.{}'.format(
            calendar.day_name[6 if week_day_index == 1 else week_day_index - 2].upper()
        )

    def _make_gregorian_period_case(self, period_type, request, queryset):
        """Constructs a Django Case statement for a certain type of period.

        Args:
            period_type (string): one of the valid aggegation type keys, either periodic (e.g.
                'day_of_week', 'month_of_year') or sequential (e.g. 'day', 'month', 'year')
            request (Request): the request, from which max and min date will be read if needed
            queryset (QuerySet): filtered queryset to use for getting date range if it's needed
                and the request is missing a max and/or min date
        Returns:
            (Case, labels), where Case is a Django Case object giving the period in which each
            record's occurred_from falls, and labels is a dict mapping Case values to period labels
        """
        # Most date-related things are 1-indexed.
        # TODO: these dates will need to be localized (which will include passing in the language).
        periodic_ranges = {
            'month_of_year': {
                'range': range(1, 13),
                'lookup': lambda x: {'occurred_from__month': x},
                'label': lambda x: [
                    {
                        'text': 'MONTH.{}'.format(calendar.month_name[x].upper()),
                        'translate': True
                    }
                ]
            },
            'week_of_year': {
                'range': range(1, 54),  # Up to 53 weeks in a year
                'lookup': lambda x: {'occurred_from__week': x},
                'label': lambda x: [
                    {
                        'text': 'AGG.WEEK',
                        'translate': True
                    },
                    {
                        'text': str(x),
                        'translate': False
                    }
                ]
            },
            'day_of_week': {
                'range': range(1, 8),
                'lookup': lambda x: {'occurred_from__week_day': x},
                'label': lambda x: [
                    {
                        'text': self._get_day_label(x),
                        'translate': True
                    }
                ]
            },
            'day_of_month': {
                'range': range(1, 32),
                'lookup': lambda x: {'occurred_from__day': x},
                'label': lambda x: [
                    {
                        'text': str(x),
                        'translate': False
                    }
                ]
            },
            'hour_of_day': {
                'range': range(0, 24),
                'lookup': lambda x: {'occurred_from__hour': x},
                'label': lambda x: [
                    {
                        'text': '{}:00'.format(x),
                        'translate': False
                    }
                ]
            },
            'all': { 
                'range': range(0, 1),
                'lookup': lambda x: {'archived': False},
                'label': lambda x: [
                    {
                        'text': 'Records', 
                        'translate': True
                    }
                ]
            }
        }

        # Ranges are built below, partly based on the ranges in 'periodic_ranges' above.
        sequential_ranges = {
            'year': {
                'range': [],
                'lookup': lambda x: {'occurred_from__year': x},
                'label': lambda x: [
                    {
                        'text': str(x),
                        'translate': False
                    }
                ]
            },
            'month': {
                'range': [],
                'lookup': lambda yr_mo: {'occurred_from__month': yr_mo[1], 'occurred_from__year': yr_mo[0]},
                'label': lambda yr_mo1: [
                    {
                        'text': '{}, {}'.format(calendar.month_name[yr_mo1[1]], str(yr_mo1[0])),
                        'translate': False
                    }
                ]
            },
            'week': {
                'range': [],
                'lookup': lambda yr_wk: {'occurred_from__week': yr_wk[1], 'occurred_from__year': yr_wk[0]},
                'label': lambda yr_wk2: [
                    {
                        'text': str(yr_wk2[0]),
                        'translate': False
                    },
                    {
                        'text': 'AGG.WEEK',
                        'translate': True
                    },
                    {
                        'text': str(yr_wk2[1]),
                        'translate': False
                    }
                ]
            },
            'day': {
                'range': [],
                'lookup': lambda yr_mo_day: {'occurred_from__month': yr_mo_day[1],
                                                 'occurred_from__year': yr_mo_day[0],
                                                 'occurred_from__day': yr_mo_day[2]},
                'label': lambda yr_mo_day3: [
                    {
                        'text': template_date(datetime.date(yr_mo_day3[0], yr_mo_day3[1], yr_mo_day3[2])),
                        'translate': False
                    }
                ]
            },
        }

        if period_type in list(periodic_ranges.keys()):
            period = periodic_ranges[period_type]
        elif period_type in list(sequential_ranges.keys()):
            # Get the desired range, either from the query params or the filtered queryset
            if request.query_params.get('occurred_min') is not None:
                min_date = parse_date(request.query_params['occurred_min']).date()
            else:
                min_date = queryset.order_by('occurred_from').first().occurred_from.date()
            if request.query_params.get('occurred_max') is not None:
                max_date = parse_date(request.query_params['occurred_max']).date()
            else:
                max_date = queryset.order_by('-occurred_from').first().occurred_from.date()

            # Build the relevant range of aggregation periods, based partly on the ones
            # already built in 'periodic_ranges' above
            sequential_ranges['year']['range'] = range(min_date.year, max_date.year + 1)
            if period_type != 'year':
                # Using the existing lists for 'year' and 'month_of_year', builds a list of
                # (year, month) tuples in order for the min_date to max_date range
                sequential_ranges['month']['range'] = [
                    (year, month) for year in sequential_ranges['year']['range']
                    for month in periodic_ranges['month_of_year']['range']
                    if min_date <= datetime.date(year, month, calendar.monthrange(year, month)[1])
                    and datetime.date(year, month, 1) <= max_date
                ]
                if period_type == 'day':
                    # Loops over the 'month' range from directly above and adds day, to make a
                    # list of (year, month, day) tuples in order for the min_date to max_date range
                    sequential_ranges['day']['range'] = [
                        (year, month, day) for (year, month) in sequential_ranges['month']['range']
                        for day in range(1, calendar.monthrange(year, month)[1] + 1)
                        if min_date <= datetime.date(year, month, day)
                        and datetime.date(year, month, day) <= max_date
                    ]
                elif period_type == 'week':
                    # Using the existing lists for 'year' and 'week_of_year', builds a list of
                    # (year, week) tuples in order for the min_date to max_date range.
                    # Figure out what week the min_date and max_date fall in, then
                    # use them as the starting and ending weeks
                    def week_start_date(year, week):
                        d = datetime.date(year, 1, 1)
                        delta_days = d.isoweekday() - 1
                        delta_weeks = week
                        if year == d.isocalendar()[0]:
                            delta_weeks -= 1
                        delta = datetime.timedelta(days=-delta_days, weeks=delta_weeks)
                        return d + delta

                    sequential_ranges['week']['range'] = [
                        (year, week) for year in sequential_ranges['year']['range']
                        for week in periodic_ranges['week_of_year']['range']
                        if week_start_date(
                                min_date.year, min_date.isocalendar()[1]
                        ) <= week_start_date(year, week)  # include first partial week
                        and week_start_date(year, week) <= max_date  # include last partial week
                    ]

            period = sequential_ranges[period_type]
        else:
            raise ParseError(detail=('row_/col_period_type must be one of {}; received {}'
                                     .format(list(periodic_ranges.keys()) + list(sequential_ranges.keys()),
                                             period_type)))

        return self._build_case_from_period(period)

    def _make_ummalqura_period_case(self, period_type, request, queryset):
        periodic_ranges = {
            'month_of_year': {
                'type': 'generated',
                'query': hijri_month_range,
            },
            'week_of_year': {
                'type': 'generated',
                'query': hijri_week_range
            },
            'day_of_week': {
                'type': 'builtin',
                'range': range(1, 8),
                'lookup': lambda x: {'occurred_from__week_day': x},
                'label': lambda x: [
                    {
                        'text': self._get_day_label(x),
                        'translate': True
                    }
                ]
            },
            'day_of_month': {
                'type': 'generated',
                'query': hijri_day_range,
            },
            'hour_of_day': {
                'type': 'builtin',
                'range': range(0, 24),
                'lookup': lambda x: {'occurred_from__hour': x},
                'label': lambda x: [
                    {
                        'text': '{}:00'.format(x),
                        'translate': False
                    }
                ]
            },
        }

        # Ranges are built below, partly based on the ranges in 'periodic_ranges' above.
        sequential_ranges = {
            'year': {
                'type': 'generated',
                'query': hijri_year_range
            },
            'month': {
                'type': 'generated',
                'query': hijri_month_range
            },
            'week': {
                'type': 'generated',
                'query': hijri_week_range
            },
            'day': {
                'type': 'generated',
                'query': hijri_day_range
            },
        }

        # need to get start/end of every month in the requested range
        # create Q expressions for each month
        # create aggregation for each type of Case query which doesn't translate directly from
        # the gregorian calendar:
        # Periodic: Day of Month, Month of Year, Week of year
        # Sequential: Day, Month, Year

        # Min / max dates are required to limit the # of Q expressions
        if request.query_params.get('occurred_min') is not None:
            min_date = parse_date(request.query_params['occurred_min']).date()
        else:
            min_date = queryset.order_by('occurred_from').first().occurred_from.date()
        if request.query_params.get('occurred_max') is not None:
            max_date = parse_date(request.query_params['occurred_max']).date()
        else:
            max_date = queryset.order_by('-occurred_from').first().occurred_from.date()

        if period_type in list(periodic_ranges.keys()):
            return self._build_ummalqura_periodic_case(
                periodic_ranges, period_type, min_date, max_date
            )
        elif period_type in list(sequential_ranges.keys()):
            return self._build_ummalqura_sequential_case(
                sequential_ranges, period_type, min_date, max_date
            )
        else:
            raise ParseError(detail=('row_/col_period_type must be one of {}; received {}'
                                     .format(list(periodic_ranges.keys()) + list(sequential_ranges.keys()),
                                             period_type)))

    def _build_ummalqura_periodic_case(self, periodic_ranges, period_type, min_date, max_date):
        period = periodic_ranges[period_type]

        if period['type'] == 'generated':
            query_dates = period['query'](min_date, max_date, True)
            date_sets = query_dates['date_sets']

            whens = []
            labels = []

            for date_set in date_sets:
                range_expressions = []
                for date_range in date_set.ranges:
                    range_expressions.append(
                        (Q(occurred_from__gte=date_range.start) &
                         Q(occurred_from__lt=date_range.end))
                    )
                if len(range_expressions) > 1:
                    in_range = reduce(lambda x, y: x | y, range_expressions)
                elif len(range_expressions) == 1:
                    in_range = range_expressions[0]
                else:
                    continue
                set_when = When(in_range, then=Value(date_set.key))
                whens.append(set_when)
                labels.append({'key': date_set.key,
                               'label': date_set.label})
            return (Case(*whens, output_field=CharField()), labels)

        elif period['type'] == 'builtin':
            return self._build_case_from_period(period)

    def _build_case_from_period(self, period):
        whens = []  # Eventual list of When-clause objects
        for x in period['range']:
            when_args = period['lookup'](x)
            when_args['then'] = Value(str(x))
            whens.append(When(**when_args))

        labels = [{'key': str(x), 'label': period['label'](x)} for x in period['range']]
        return (Case(*whens, output_field=CharField()), labels)


    def _build_ummalqura_sequential_case(self, sequential_ranges, period_type, min_date, max_date):
        period = sequential_ranges[period_type]
        if period and period['type'] == 'generated':
            query_dates = period['query'](min_date, max_date)
            date_sets = query_dates['date_sets']

            whens = []
            labels = []

            for date_set in date_sets:
                # only ever 1 range for each sequential when
                date_range = date_set.ranges[0]
                range_expression = (
                    Q(occurred_from__gte=date_range.start) &
                    Q(occurred_from__lt=date_range.end))
                set_when = When(range_expression, then=Value(date_set.key))
                whens.append(set_when)
                labels.append({'key': date_set.key,
                               'label': date_set.label})
            return (Case(*whens, output_field=CharField()), labels)

        else:
            raise ParseError(
                description='Invalid sequential aggregations type for ummalqura calendar'
            )

    def _make_boundary_case(self, boundary_id):
        """Constructs a Django Case statement for points falling within a particular polygon

        Args:
            boundary_id (uuid): Id of a Boundary whose BoundaryPolygons should be used in the case
        Returns:
            (Case, labels), where Case is a Django Case object outputting the UUID of the polygon
            which contains each record, and labels is a dict mapping boundary pks to their labels.
        """
        boundary = Boundary.objects.get(pk=boundary_id)
        polygons = BoundaryPolygon.objects.filter(boundary=boundary)

        # Sort the polygons by display_field and remove any items that have an empty label
        polygons = sorted([p for p in polygons if p.data[boundary.display_field]],
                          key=lambda p: p.data[boundary.display_field])
        labels = [
            {
                'key': str(poly.pk),
                'label': [
                    {'text': poly.data[boundary.display_field], 'translate': False}
                ]
            }
            for poly in polygons
        ]

        return (Case(*[When(geom__within=poly.geom, then=Value(poly.pk)) for poly in polygons],
                     output_field=UUIDField()), labels)

    def _is_multiple(self, schema, path):
        """Determines whether this related object type has a multiple item configuration
        
        Args:
            schema (RecordSchema): A RecordSchema to get properties from
            path (list): A list of path fragments to navigate to the desired property
        Returns:
            True if this related object type has a multiple item configuration
        """
        # The related key is always the first item appearing in the path
        try:
            if 'multiple' not in schema.schema['definitions'][path[0]]:
                return False;
            return schema.schema['definitions'][path[0]]['multiple']
        except:
            # This shouldn't ever fail, but in case a bug causes the schema to change, treat
            # the related type as non-multiple, since that's the main use-case
            logger.exception('Exception obtaining multiple with path: %s', path)
            return False

    def _make_choices_case(self, schema, path):
        """Constructs a Django Case statement for the choices of a schema property

        Args:
            schema (RecordSchema): A RecordSchema to get properties from
            path (list): A list of path fragments to navigate to the desired property
        Returns:
            (Case, labels), where Case is a Django Case object with the choice of each record,
            and labels is a dict matching choices to their labels (currently the same).
        """
        multiple = self._is_multiple(schema, path)
        choices = self._get_schema_enum_choices(schema, path)

        whens = []
        for choice in choices:
            filter_rule = self._make_djsonb_containment_filter(path, choice, multiple)
            whens.append(When(data__jsonb=filter_rule, then=Value(choice)))
        labels = [
            {'key': choice, 'label': [{'text': choice, 'translate': False}]}
            for choice in choices
        ]
        return (Case(*whens, output_field=CharField()), labels)

    def _get_multiple_choices_annotated_tuple(self, queryset, annotation_id, schema, path, relate=None):
        """Helper wrapper for annotating a queryset with a case statement

        Args:
          queryset (QuerySet): The input queryset
          annotation_id (String): 'row' or 'col'
          schema (RecordSchema): A RecordSchema to get properties from
          path (list): A list of path fragments to navigate to the desired property
          relate (string): What to count - if None, we will return the registries count; 
            else, the aggregated row or column for the related value.

        Returns:
            A 3-tuple of:
              - boolean which specifies whether or not this is a 'multiple' query (always False)
              - dict mapping Case values to labels
              - the newly-annotated queryset
        """

        choices = self._get_schema_enum_choices(schema, path)
        labels = [
            {'key': choice, 'label': [{'text': choice, 'translate': False}]}
            for choice in choices
        ]
        is_array=self._is_multiple(schema, path)
        annotations = {}
        for choice in choices:
            if is_array:
                pattern=json.dumps({path[2]:choice})
                pattern=pattern[1:len(pattern)-1]
                if not relate or relate=="":
                    annotations['{}_{}'.format(annotation_id, choice)] = RawSQL("\
                        SELECT \
    case when \"grout_record\".\"data\"->>%s ~ %s = 't' then 1 else 0 end\
    ",(path[0], pattern)
                    )
                else:
                    annotations['{}_{}'.format(annotation_id, choice)] = RawSQL("\
                        SELECT \
                        -1+array_length(regexp_split_to_array(\"grout_record\".\"data\"->>%s, %s),1) as l \
                        ",(path[0], pattern)
                                        )
            else:
                expression="data__%s__%s__contains"  % (path[0], path[2])
                annotations['{}_{}'.format(annotation_id, choice)] = Case(
                    When(**{expression: choice}, then=Value(1)),
                    output_field=IntegerField(), default=Value(0)
                )
        return (True, labels, queryset.annotate(**annotations))

    # TODO: This snippet also appears in data/serializers.py and should be refactored into the Grout
    # RecordSchema model
    def _get_schema_enum_choices(self, schema, path):
        """Returns the choices in a schema enum field at path

        Args:
            schema (RecordSchema): A RecordSchema to get properties from
            path (list): A list of path fragments to navigate to the desired property
        Returns:
            choices, where choices is a list of strings representing the valid values of the enum.
        """
        # Walk down the schema using the path components
        obj = schema.schema['definitions']  # 'definitions' is the root of all schema paths
        for key in path:
            try:
                obj = obj[key]
            except KeyError as e:
                raise ParseError(
                    detail='Could not look up path "{}", "{}" was not found in schema'.format(
                        ':'.join(path), key))

        # Checkbox types have an additional 'items' part at the end of the path
        if 'items' in obj:
            obj = obj['items']

        # Build a JSONB filter that will catch Records that match each choice in the enum.
        choices = obj.get('enum', None)
        if not choices:
            raise ParseError(detail="The property at choices_path is missing required 'enum' field")
        return choices

    def _make_djsonb_containment_filter(self, path, value, multiple):
        """Returns a djsonb containment filter for a path to contain a value

        Args:
            path (list): A list of strings denoting the path
            value (String): The value to match on
            multiple (Boolean): True if this related object type has a multiple item configuration
        Returns:
            A dict representing a valid djsonb containment filter specification that matches if the
            field at path contains value
        """
        # Build the djsonb filter specification from the inside out, and skip schema-only keys, i.e.
        # 'properties' and 'items'.
        filter_path = [component for component in reversed(path)
                       if component not in ['properties', 'items']]

        # Check if a row contains either the value as a string, or the value in an array.
        # The string value handles dropdown types, while the array handles checkbox types.
        # Since an admin may switch between dropdowns and checkboxes at any time, performing
        # both checks guarantees the filter will be correctly applied for data in both formats.

        rule_type = 'containment_multiple' if multiple else 'containment'
        filter_rule = dict(_rule_type=rule_type, contains=[value, [value]])
        for component in filter_path:
            # Nest filter inside itself so we eventually get something like:
            # {"incidentDetails": {"severity": {"_rule_type": "containment"}}}
            tmp = dict()
            tmp[component] = filter_rule
            filter_rule = tmp
        return filter_rule


class DriverRecordAuditLogViewSet(viewsets.ModelViewSet):
    """Viewset for accessing audit logs; will output CSVs if Accept text/csv is specified"""
    queryset = RecordAuditLogEntry.objects.all()
    renderer_classes = api_settings.DEFAULT_RENDERER_CLASSES + [csv_renderer.CSVRenderer]
    serializer_class = RecordAuditLogEntrySerializer
    permission_classes = (IsAdminAndReadOnly,)
    filter_class = filters.RecordAuditLogFilter
    pagination_class = None

    def list(self, request, *args, **kwargs):
        """Validate filter params"""
        # Will throw an error if these are missing or not valid ISO-8601
        try:
            min_date = parse_date(request.query_params['min_date'])
            max_date = parse_date(request.query_params['max_date'])
        except KeyError:
            raise ParseError("min_date and max_date must both be provided")
        except ValueError:
            raise ParseError("occurred_min and occurred_max must both be valid dates")
        # Make sure that min_date and max_date are less than 32 days apart
        if max_date - min_date >= datetime.timedelta(days=32):
            raise ParseError('max_date and min_date must be less than one month apart')
        return super(DriverRecordAuditLogViewSet, self).list(request, *args, **kwargs)

    # Override default CSV field ordering and include URL
    def get_renderer_context(self):
        context = super(DriverRecordAuditLogViewSet, self).get_renderer_context()
        context['header'] = self.serializer_class.Meta.fields
        return context


def start_jar_build(schema_uuid):
    """Helper to kick off build of a Dalvik jar file with model classes for a schema.
    Publishes schema with its UUID to a redis channel that the build task listens on.

    :param schema_uuid: Schema UUID, which is the key used to store the jar on redis.
    """
    # Find the schema with the requested UUID.
    schema_model = RecordSchema.objects.get(uuid=schema_uuid)
    if not schema_model:
        return False

    schema = schema_model.schema
    redis_conn = get_redis_connection('jars')
    redis_conn.publish('jar-build', json.dumps({'uuid': schema_uuid, 'schema': schema}))
    return True


# override grout views to set permissions and trigger model jar builds
class DriverBoundaryPolygonViewSet(BoundaryPolygonViewSet):
    permission_classes = (IsAdminOrReadOnly,)


class DriverRecordTypeViewSet(RecordTypeViewSet):
    permission_classes = (IsAdminOrReadOnly,)


class DriverRecordSchemaViewSet(RecordSchemaViewSet):
    permission_classes = (IsAdminOrReadOnly,)

    # Filter out everything except details for read-only users
    def get_serializer_class(self):
        #if is_admin_or_writer(self.request.user):
        return RecordSchemaSerializer
        #return DetailsReadOnlyRecordSchemaSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        start_jar_build(str(instance.pk))

    def perform_update(self, serializer):
        instance = serializer.save()
        start_jar_build(str(instance.pk))

    def perform_destroy(self, instance):
        redis_conn = get_redis_connection('jars')
        redis_conn.delete(str(instance.pk))
        instance.delete()


class DriverBoundaryViewSet(BoundaryViewSet):
    permission_classes = (IsAdminOrReadOnly,)


class DriverRecordDuplicateViewSet(viewsets.ModelViewSet):
    queryset = RecordDuplicate.objects.all().order_by('record__occurred_to')
    serializer_class = RecordDuplicateSerializer
    permission_classes = (ReadersReadWritersWrite,)
    filter_class = filters.RecordDuplicateFilter
    @action(detail=True, methods=['patch'])
    def resolve(self, request, pk=None):
        duplicate = self.queryset.get(pk=pk)
        recordUUID = request.data.get('recordUUID', None)
        if recordUUID is None:
            # No record id means they want to keep both, so just resolve the duplicate
            duplicate.resolved = True
            duplicate.save()
            resolved_ids = [duplicate.pk]
        else:
            # If they picked a record, archive the other one and resolve all duplicates involving it
            # (which will include the current one)
            if recordUUID == str(duplicate.record.uuid):
                rejected_record = duplicate.duplicate_record
            elif recordUUID == str(duplicate.duplicate_record.uuid):
                rejected_record = duplicate.record
            else:
                raise Exception("Error: Trying to resolve a duplicate with an unconnected record.")
            rejected_record.archived = True
            rejected_record.save()
            resolved_dup_qs = RecordDuplicate.objects.filter(Q(resolved=False),
                                                             Q(record=rejected_record) |
                                                             Q(duplicate_record=rejected_record))
            resolved_ids = [str(uuid) for uuid in resolved_dup_qs.values_list('pk', flat=True)]
            resolved_dup_qs.update(resolved=True)
        return Response({'resolved': resolved_ids})


class DriverRecordCostConfigViewSet(viewsets.ModelViewSet):
    queryset = RecordCostConfig.objects.all()
    serializer_class = RecordCostConfigSerializer
    filter_fields = ('record_type', )


class RecordCsvExportViewSet(viewsets.ViewSet):
    """A view for interacting with CSV export jobs

    Since these jobs are not model-backed, we won't use any of the standard DRF mixins
    """
    permissions_classes = (IsAdminOrReadOnly,)

    def retrieve(self, request, pk=None):
        """Return the status of the celery task with query_params['taskid']"""
        # N.B. Celery will never return an error if a task_id doesn't correspond to a
        # real task; it will simply return a task with a status of 'PENDING' that will never
        # complete.
        job_result = export_csv.AsyncResult(pk)
        if job_result.state in states.READY_STATES:
            if job_result.state in states.EXCEPTION_STATES:
                e = job_result.get(propagate=False)
                return Response({'status': job_result.state, 'error': str(e)})
            # Set up the URL to proxy to the celery worker
            # TODO: This won't work with multiple celery workers
            # TODO: We should add a cleanup task to prevent result files from accumulating
            # on the celery worker.
            uri = '{scheme}://{host}{prefix}{file}'.format(scheme=request.scheme,
                                                            host=request.get_host(),
                                                            prefix=settings.CELERY_DOWNLOAD_PREFIX,
                                                            file=job_result.get())
            return Response({'status': job_result.state, 'result': uri})
        return Response({'status': job_result.state, 'info': job_result.info})

    def create(self, request, *args, **kwargs):
        """Create a new CSV export task, using the passed filterkey as a parameter

        filterkey is the same as the "tilekey" that we pass to Windshaft; it must be requested
        from the Records endpoint using tilekey=true
        """
        filter_key = request.data.get('tilekey', None)
        if not filter_key:
            return Response({'errors': {'tilekey': 'This parameter is required'}},
                            status=status.HTTP_400_BAD_REQUEST)

        task = export_csv.delay(filter_key, request.user.pk)
        return Response({'success': True, 'taskid': task.id}, status=status.HTTP_201_CREATED)

    # TODO: If we switch to a Django/ORM database backend, we can subclass AbortableTask
    # and allow cancellation as well.


class JarFileRenderer(renderers.BaseRenderer):
    """Renderer for downloading JARs.

    http://www.django-rest-framework.org/api-guide/renderers/#data
    """
    media_type = 'application/java-archive'
    charset = None
    render_style = 'binary'
    format = 'jar'

    def render(self, data, media_type=None, renderer_context=None, format=None):
        return data


class AndroidSchemaModelsViewSet(viewsets.ViewSet):
    """A view for interacting with Android jar build jobs."""

    permissions_classes = (IsAuthenticated,)
    renderer_classes = [JarFileRenderer] + api_settings.DEFAULT_RENDERER_CLASSES

    def finalize_response(self, request, response, *args, **kwargs):
        response = super(AndroidSchemaModelsViewSet, self).finalize_response(request, response, *args, **kwargs)
        if isinstance(response.accepted_renderer, JarFileRenderer):
            response['content-disposition'] = 'attachment; filename=models.jar'
        return response

    def retrieve(self, request, pk=None):
        """Return the model jar if found, or kick of a task to create it if not found.

        If a previous message has already been sent for the same UUID, the new request will be
        ignored by the subscriber, which processes requests serially.
        """

        uuid = str(pk)
        if not uuid:
            return Response({'errors': {'uuid': 'This parameter is required'}},
                            status=status.HTTP_400_BAD_REQUEST)

        redis_conn = get_redis_connection('jars')
        found_jar = redis_conn.get(uuid)
        if not found_jar:
            found = RecordSchema.objects.filter(uuid=uuid).count()
            if found == 1:
                # have a good schema UUID but no jar for it; go kick off a jar build
                start_jar_build(uuid)
                return Response({'success': True}, status=status.HTTP_201_CREATED)
            else:
                return Response({'errors': {'uuid': 'Schema matching UUID not found'}},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            # update cache expiry, then return the jar binary found in redis
            # to actually download the file, specify format=jar request parameter
            redis_conn.expire(uuid, settings.JARFILE_REDIS_TTL_SECONDS)
            return Response(found_jar)

def get_config(request):
    if not request.user.is_authenticated:
        return JsonResponse({'errors': {'uuid': 'Denied'}},
                                status=status.HTTP_403_FORBIDDEN)        
    
    return JsonResponse(
        {'config': {
            'MAP_CENTER_LATITUDE': config.MAP_CENTER_LATITUDE,
            'MAP_CENTER_LONGITUDE': config.MAP_CENTER_LONGITUDE,
            'MAP_ZOOM': config.MAP_ZOOM,
            "PRIMARY_LABEL": config.PRIMARY_LABEL,
            "SECONDARY_LABEL": config.SECONDARY_LABEL
            }
        },
        status=status.HTTP_200_OK)

class PictureViewSet(viewsets.ViewSet):
    def list(self, request):
        queryset=Picture.objects.all()
        serializer=PictureSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        
        
        pass

class DictionaryViewSet(viewsets.ViewSet):
    serializer_class=DictionarySerializer
    queryset=Dictionary.objects.all()
    def retrieve(self, request, pk=None):
        queryset=Dictionary.objects.all()
        dictionary=get_object_or_404(queryset,language_code=pk)
        serializer=DictionarySerializer(dictionary)
        return Response(serializer.data)    
    def list(self, request):
        queryset = Dictionary.objects.all()
        serializer = DictionarySerializer(queryset, many=True)
        return Response(serializer.data)

