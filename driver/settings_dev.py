from driver.settings import *
import subprocess

import os
from django.utils.translation import ugettext_lazy as _

DEVELOP = True
STAGING = True if os.environ.get('DJANGO_ENV', 'staging') == 'staging' else False
PRODUCTION = not DEVELOP and not STAGING

f = open(".env", "r")
e={}
for k in [ t.split('=') for t in f.readlines() ]:
    e[k[0]]=k[1].replace("\n", "")

DRIVER_DB_HOST=e['DATABASE_HOST']
WINDSHAFT_HOST=subprocess.check_output(["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "windshaft-%s" % (e['CONTAINER_NAME'])]).decode('utf8').strip()
MAPSERVER_HOST=subprocess.check_output(["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "mapserver-%s" % (e['CONTAINER_NAME'])]).decode('utf8').strip()
#DRIVER_DB_HOST=subprocess.check_output(["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "database-%s" % (e['CONTAINER_NAME'])]).decode('utf8').strip()
REDIS_HOST = subprocess.check_output(["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "redis-server-%s" % (e['CONTAINER_NAME'])]).decode('utf8').strip()
CONTAINER_NAME=e['CONTAINER_NAME']
CONSTANCE_CONFIG['WINDSHAFT']=("http://%s" % (WINDSHAFT_HOST,), "WindShaft")
CONSTANCE_CONFIG['MAPSERVER']=("http://%s" % (MAPSERVER_HOST,), "Mapserver")

# Quick-start development settings - unsuitable for production

# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'sfdgljfkghdjkgfhjkghdskljhgljhsdjkghfgjklhdgjklshjkhg' # os.environ['DJANGO_SECRET_KEY']

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = DEVELOP

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': e['DATABASE_NAME'],
        'HOST': DRIVER_DB_HOST,
        'PORT': os.environ.get('DRIVER_DB_PORT', 5432),
        'USER': os.environ.get('DRIVER_DB_USER', 'driver'),
        'PASSWORD': e['DATABASE_PASSWORD'],
        'CONN_MAX_AGE': 3600,  # in seconds
        'OPTIONS': {
        #    'sslmode': 'require'
        }
    }
}


from django.utils.translation import ugettext_lazy as _
LANGUAGES = ( 
   ('de', _('German')),
   ('en', _('English')),
   ('fr', _('French')),
   ('es', _('Spanish')),
   ('pt-br', _('Portuguese'))
)

TIME_ZONE = os.environ.get("DRIVER_LOCAL_TIME_ZONE", 'America/La_Paz')

BLACKSPOT_RECORD_TYPE_LABEL = os.environ.get('BLACKSPOT_RECORD_TYPE_LABEL', 'Incident')

# user and group settings

## django-oidc settings
HOST_URL = os.environ.get('HOST_URL', '')

APPEND_SLASH=True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR+'/static/'

CACHES = {
    "default": {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://' + REDIS_HOST + ':' + REDIS_PORT + '/2',
        'TIMEOUT': None,  # never expire
        'KEY_PREFIX': 'DJANGO',
        'VERSION': 1,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,  # seconds
            'SOCKET_TIMEOUT': 5,  # seconds
            'MAX_ENTRIES': 900,  # defaults to 300
            'CULL_FREQUENCY': 4,  # fraction culled when max reached (1 / CULL_FREQ); default: 3
            # 'COMPRESS_MIN_LEN': 0, # set to value > 0 to enable compression
        }
    },
    "jars": {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://' + REDIS_HOST + ':' + REDIS_PORT + '/3',
        'TIMEOUT': JARFILE_REDIS_TTL_SECONDS,
        'KEY_PREFIX': None,
        'VERSION': 1,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,  # seconds
            'SOCKET_TIMEOUT': 5,  # seconds
            'MAX_ENTRIES': 300,  # defaults to 300
            'CULL_FREQUENCY': 4,  # fraction culled when max reached (1 / CULL_FREQ); default: 3
            # 'COMPRESS_MIN_LEN': 0, # set to value > 0 to enable compression
        }
    },
    "boundaries": {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://{host}:{port}/4'.format(host=REDIS_HOST, port=REDIS_PORT),
        # Timeout is set and renewed at the individual key level in data/filters.py
        'TIMEOUT': None,
        'KEY_PREFIX': 'boundary',
        'VERSION': 1,
    },
    "geocode": {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://{host}:{port}/5'.format(host=REDIS_HOST, port=REDIS_PORT),
        'TIMEOUT': None,
        'KEY_PREFIX': 'geocode',
        'VERSION': 1,
    },
}

# Celery
BROKER_URL = 'redis://{}:{}/0'.format(REDIS_HOST, REDIS_PORT)
CELERY_RESULT_BACKEND = 'redis://{}:{}/1'.format(REDIS_HOST, REDIS_PORT)
CELERY_EXPORTS_FILE_PATH = BASE_DIR+'/zip'

#from constance import config
#config.MAPSERVER=subprocess.check_output(["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "mapcache-bolivia"]).decode('utf8').strip()

def show_toolbar(request):
    return True
DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK" : show_toolbar,
}


CORS_ORIGIN_ALLOW_ALL = True # If this is used then `CORS_ORIGIN_WHITELIST` will not have any effect
CORS_ALLOW_CREDENTIALS = True


