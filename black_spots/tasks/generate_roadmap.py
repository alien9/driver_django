import fiona
from fiona.crs import from_epsg
from functools import partial
import csv
import gc
import glob
import itertools
import logging
import os
import pyproj
import pytz
import rtree
import shutil
from math import ceil
import tarfile
import tempfile
import billiard as multiprocessing
from shapely.geometry import mapping, shape, LineString, MultiPoint, Point
from shapely.ops import transform, unary_union
from django.conf import settings
from django.core.files import File
from django.db import transaction
from black_spots.models import Road, RoadMap
from grout.models import BoundaryPolygon
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()
from django.core.cache import cache

from black_spots.models import BlackSpotRecordsFile, RoadSegmentsShapefile

from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)
from constance import config

logger = logging.getLogger()


@shared_task(track_started=True)
def generate_roadmap(roadmap_id):
    roadmap=RoadMap.objects.get(pk=roadmap_id)
    fn=os.path.join(settings.CELERY_EXPORTS_FILE_PATH, f"roadmap_{roadmap_id}.gpkg")
    with fiona.open(fn, 'w',
        driver='GPKG',
        crs=from_epsg(4326),
        schema= {'geometry': 'MultiLineString', 'properties': {'name': 'str','fullname': 'str'}}
        ) as c:
            n=0
            total=Road.objects.filter(roadmap_id=roadmap_id).count()
            for r in Road.objects.filter(roadmap_id=roadmap_id):
                name=r.data[roadmap.display_field]
                fullname=None
                if name is not None:
                    polygons=BoundaryPolygon.objects.filter(geom__contains=r.geom).order_by("-boundary__order")
                    fullname=f'{name}, {", ".join(map(lambda p: p.data[p.boundary.display_field],  polygons))}'
                                       
                c.write({'properties':{'fullname':fullname,'name': r.data[roadmap.display_field]}, 'geometry': r.data['geom']})
                n+=1
                if n % 1000 ==0:
                    cache.set(f"roadmap_{roadmap_id}.gpkg", 100*n/total)
                    logger.warning(f"Mahdar road {(100*n/total)} %")
            c.close()
            