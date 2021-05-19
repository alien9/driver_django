from django.conf import settings
from celery import shared_task
from celery.utils.log import get_task_logger
from django_redis import get_redis_connection
import time, uuid
from data.models import DriverRecord

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