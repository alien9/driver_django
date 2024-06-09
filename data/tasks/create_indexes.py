from django.conf import settings
from celery import shared_task
from celery.utils.log import get_task_logger
from django_redis import get_redis_connection
import time, uuid, pytz, os, glob
from data.models import DriverRecord, RecordType
from grout.models import Boundary
from black_spots.models import RoadMap, BlackSpotSet, BlackSpot
from constance import config  
from django.db import connection
from datetime import datetime
from django.contrib.gis.geos import Point 
from django.db import connection

logger = get_task_logger(__name__)
        
@shared_task(track_started=True)
def create_indexes():
    rs=RecordType.objects.filter(active=True, label=config.PRIMARY_LABEL)
    if not len(rs):
        return
    rs=rs[0]
    schema=rs.get_current_schema()
    with connection.cursor() as cursor:
        cursor.execute("SELECT indexname FROM pg_indexes WHERE tablename= 'grout_record' and indexname like 'grout_record_expr%'")
        rows = cursor.fetchall()
        for r in rows:
            with connection.cursor() as cursor:
                cursor.execute(f"DROP INDEX {r[0]}")
    
    for table in schema.schema.get("definitions").keys():
        for row in schema.schema.get("definitions").get(table).get('properties').keys():
            field=schema.schema.get("definitions").get(table).get('properties').get(row)
            if field.get("isSearchable"):
                for t in field.get("items", {}).get("enum", {}):
                    table_name="{"+f'"{table}"'
                    if field.get("displayType")=="checkbox" or field.get("format")=="checkbox":
                        field_value="[{"+f'"{row}": "{t}"'+"}]}"
                    else:
                        field_value="{"+f'"{row}":"{t}"'+"}}"
                    logger.info(field.get("displayType"))
                    query=f"create index on grout_record ((data @> '{table_name}: {field_value}'));"
                    with connection.cursor() as cursor:
                        cursor.execute(query)
                #logger.info(field)
                for t in field.get("enum", {}):
                    table_name="{"+f'"{table}"'
                    if field.get("displayType")=="checkbox" or field.get("format")=="checkbox":
                        field_value="[{"+f'"{row}": "{t}"'+"}]}"
                    else:
                        field_value="{"+f'"{row}":"{t}"'+"}}"
                    logger.info(field.get("displayType"))
                    props=schema.schema.get("properties").get(table) #.get(row)
                    import json
                    if field.get("displayType")=="checkbox":
                        query=f"create index on grout_record ((data @> '{table_name}: {field_value}'));"
                    else:
                        query=f"create index on grout_record ((data @> '{table_name}: {field_value}'));"
                    logger.info(query)
                    with connection.cursor() as cursor:
                        cursor.execute(query)
                            
                    

    with connection.cursor() as cursor:
        cursor.execute("VACUUM ANALYZE grout_record")




        
    
