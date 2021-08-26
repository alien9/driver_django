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
def generate_blackspots():
    rs=RecordType.objects.filter(active=True, label=config.PRIMARY_LABEL)
    if not len(rs):
        print("No datatype found.")
        return
    tz = pytz.timezone(config.TIMEZONE)
    b=BlackSpotSet(record_type=rs[0])
    d=datetime.now()
    d=d.replace(tzinfo=tz)
    b.effective_start=d
    b.save()
    schema=rs[0].get_current_schema()
    records=schema.record_set.filter(archived=False and geom is not None)
    with connection.cursor() as cursor:
        for r in records:
            segment=r.driverrecord.segment
            segment.calculate_cost(rs[0])
            cursor.execute("select st_transform(st_buffer(st_transform(geom,3857),50),4326) from data_recordsegment where id=%s", [segment.id])
            row=cursor.fetchone()
            bs=BlackSpot()
            bs.black_spot_set=b
            bs.geom=row[0]
            bs.severity_score=segment.data['cost']
            bs.num_records=segment.data['count']
            bs.num_severe=segment.data['count']
            bs.save()
                            


