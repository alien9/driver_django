from driver.settings import *
import subprocess

import os
from django.utils.translation import ugettext_lazy as _

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = ['http://localhost:4201']

DEVELOP = True
STAGING = True if os.environ.get(
    'DJANGO_ENV', 'staging') == 'staging' else False
PRODUCTION = not DEVELOP and not STAGING


WINDSHAFT_HOST = 'localhost'
MAPSERVER_HOST = os.getenv('MAPSERVER', 'host.docker.internal:8999')
REDIS_HOST = os.getenv('DRIVER_REDIS_HOST', 'host.docker.internal')
CONTAINER_NAME = "development"
CONSTANCE_CONFIG['WINDSHAFT'] = ("http://%s" % (WINDSHAFT_HOST,), "WindShaft")
CONSTANCE_CONFIG['MAPSERVER'] = ("http://%s" % (MAPSERVER_HOST,), "Mapserver")

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Quick-start development settings - unsuitable for production

# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# os.environ['DJANGO_SECRET_KEY']
SECRET_KEY = 'sfdgljfkghdjkgfhjkghdskljhgljhsdjkghfgjklhdgjklshjkhg'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = DEVELOP

TIME_ZONE = os.environ.get("DRIVER_LOCAL_TIME_ZONE", 'America/La_Paz')

# user and group settings

# django-oidc settings
HOST_URL = os.environ.get('HOST_URL', '')

APPEND_SLASH = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR+'/static/'
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'templates/dist'),
    os.path.join(BASE_DIR, 'templates/schema_editor/dist'),
)
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
            # fraction culled when max reached (1 / CULL_FREQ); default: 3
            'CULL_FREQUENCY': 4,
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
            # fraction culled when max reached (1 / CULL_FREQ); default: 3
            'CULL_FREQUENCY': 4,
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

# from constance import config
# config.MAPSERVER=subprocess.check_output(["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "mapcache-bolivia"]).decode('utf8').strip()


def show_toolbar(request):
    return True


DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": show_toolbar,
}

DEDUPE_DISTANCE_DEGREES = 0.5

CORS_ORIGIN_ALLOW_ALL = True
