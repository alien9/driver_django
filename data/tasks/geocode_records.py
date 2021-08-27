from django.conf import settings
from celery import shared_task
from celery.utils.log import get_task_logger
from django_redis import get_redis_connection
import time, uuid, pytz
from data.models import DriverRecord, RecordType
from black_spots.models import BlackSpot, BlackSpotSet
from constance import config  
from django.db import connection
from datetime import datetime
logger = get_task_logger(__name__)

@shared_task(track_started=True)
def geocode_records():
    redis_conn = get_redis_connection('geocode')
    is_running=redis_conn.get('is_running')
    print(is_running)
    if is_running==b'1':
        print("It is already running.")
    #    return
    redis_conn.set('is_running', "1")
    id = redis_conn.lpop('records')
    redis_conn.close()
    try:
        while id is not None:
            print(id)
            redis_conn = get_redis_connection('geocode')
            redis_conn.close()
            r=DriverRecord.objects.get(pk=id.decode('utf8'))
            r.geocode()
            id = redis_conn.lpop('records')
        redis_conn = get_redis_connection('geocode')
        redis_conn.set('is_running', "0")
    except KeyboardInterrupt:
        redis_conn = get_redis_connection('geocode')
        redis_conn.delete('is_running')
        
        
@shared_task(track_started=True)
def generate_blackspots(blackspotset_uuid=None, user_id=None):
    logger.debug("DATA GENERATE BLACK SPOTS")
    if blackspotset_uuid is None:
        rs=RecordType.objects.filter(active=True, label=config.PRIMARY_LABEL)
        if not len(rs):
            print("No datatype found.")
            return
        rs=rs[0]
        tz = pytz.timezone(config.TIMEZONE)
        b=BlackSpotSet(record_type=rs, size=100)
        d=datetime.now()
        d=d.replace(tzinfo=tz)
        b.effective_start=d
        b.save()
        schema=rs.get_current_schema()
        records=schema.record_set.filter(archived=False and geom is not None)
    else:
        b=BlackSpotSet.objects.get(pk=blackspotset_uuid)
        rs=b.record_type
        schema=rs.get_current_schema()
        records=schema.record_set.filter(archived=False and geom is not None) #remember to filter
    for blackspot in b.blackspot_set.all():
        blackspot.delete()
    b.save()
    with connection.cursor() as cursor:
        for r in records:
            if not hasattr(r, 'driverrecord'):
                r.driverrecord=DriverRecord()
            r.driverrecord.geocode(b.roadmap_id, b.size)
        logger.debug("segments geocoded")
        segments=b.roadmap.recordsegment_set.filter(size=b.size)
        for segment in segments:
            segment.calculate_cost(rs)
            cursor.execute("select st_transform(st_buffer(st_transform(geom,3857),50),4326) from data_recordsegment where id=%s", [segment.id])
            row=cursor.fetchone()
            bs=BlackSpot()
            bs.black_spot_set=b
            bs.geom=row[0]
            bs.severity_score=segment.data['cost']
            bs.num_records=segment.data['count']
            bs.num_severe=segment.data['count']
            if segment.name is not None:
                bs.name=segment.name    
            bs.save()
            logger.debug("blackspot.save")
        blackspots=b.blackspot_set.order_by('-severity_score')
        total=b.blackspot_set.count()-1
        limit=round(0.2*total)
        while total>limit:
            blackspots[total].delete()
            total-=1
        


