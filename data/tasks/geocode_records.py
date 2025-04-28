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
from whoosh.index import create_in
from whoosh.fields import Schema, TEXT, ID, STORED, NUMERIC
from django.contrib.gis.geos import Point 

logger = get_task_logger(__name__)

@shared_task(track_started=True)
def geocode_records(blackspotset):
    bs=BlackSpotSet.objects.filter(uuid=blackspotset)
    if len(bs):
        for r in DriverRecord.objects.all():
            r.geocode(bs[0].roadmap_id, bs[0].size)
        
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
    else:
        b=BlackSpotSet.objects.get(pk=blackspotset_uuid)
        rs=b.record_type
    schema=rs.get_current_schema()

    records=schema.record_set.filter(archived=False,occurred_from__gte=b.effective_start)
    if b.effective_end is not None:
        records=records.filter(occurred_from__lte=b.effective_end)
    logger.debug("Records retrieved:")
    logger.debug(records.query)


    for blackspot in b.blackspot_set.all():
        blackspot.delete()
    segments=set()
    with connection.cursor() as cursor:
        for r in records:
            if not hasattr(r, 'driverrecord'):
                r.driverrecord=DriverRecord()
            segment=r.driverrecord.geocode(b.roadmap_id, b.size)
            if segment is not None:
                segments.add(segment)

        logger.debug("%s segments geocoded" % len(segments))
        for segment in segments:
            segment.calculate_cost(rs)
            cursor.execute("select st_transform(st_buffer(st_transform(geom,3857),50),4326), geom from data_recordsegment where id=%s", [segment.id])
            row=cursor.fetchone()
            bs=BlackSpot()
            bs.black_spot_set=b
            bs.geom=row[0]
            bs.the_geom=row[1]
            bs.severity_score=0
            bs.num_records=0
            bs.num_severe=0
            if 'cost' in segment.data:
                bs.severity_score=segment.data['cost']
                bs.num_records=segment.data['count']
                bs.num_severe=segment.data['count']
            if segment.name is not None:
                bs.name=segment.name
            bs.save()
        blackspots=b.blackspot_set.order_by('-severity_score')
        total=b.blackspot_set.count()-1
        limit=round(0.2*total)
        while total>limit:
            blackspots[total].delete()
            total-=1
        

@shared_task(track_started=True)
def generate_roads_index(roadmap_id):
    roadmap=RoadMap.objects.get(pk=roadmap_id)
    if roadmap.get_display_field() is None:
        return
    schema = Schema(name=TEXT(stored=True),id=ID(stored=True),lat=NUMERIC(stored=True), lon=NUMERIC(stored=True), fullname=STORED)
    if not os.path.exists("indexdir"):
        os.mkdir("indexdir")
    ixname="indexdir/{road}".format(road=roadmap_id)
    if os.path.exists(ixname):
        import shutil
        shutil.rmtree(ixname)
    os.mkdir(ixname)
            
    logger.debug("creating %s"% (ixname))
    # Creating a index writer to add document as per schema
    ix = create_in(ixname,schema)
    writer = ix.writer()
    display_field=roadmap.display_field
    names=set()
    n=0
    for rua in roadmap.roads.all():
        if display_field in rua.data:
            if rua.data[display_field] is not None:
                if len(rua.data[display_field])>2:
                    if len(rua.geom.coords)>0:
                        loc=rua.geom.coords[len(rua.geom.coords)//2]
                        streetname=rua.data[display_field]
                        hb=False
                        for bo in Boundary.objects.all():
                            p=rua.geom.coords[len(rua.geom.coords)//2]
                            bp=bo.polygons.filter(geom__contains=Point(p[0], p[1], rua.geom.srid))
                            if len(bp):
                                streetname+=" - {local}".format(local=bp[0].data[bo.display_field])
                                hb=True
                        if hb and (streetname not in names):
                            writer.add_document(name=rua.data[display_field], fullname=streetname,id=str(rua.uuid),lat=loc[1],lon=loc[0])
                            logger.debug("%s: added %s"% (n, streetname))
                            names.add(streetname)
                            n+=1

    writer.commit()
