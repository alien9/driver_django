from driver.settings import *

import os
from django.utils.translation import ugettext_lazy as _

DEVELOP = True
STAGING = True if os.environ.get('DJANGO_ENV', 'staging') == 'staging' else False
PRODUCTION = not DEVELOP and not STAGING

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'sfdgljfkghdjkgfhjkghdskljhgljhsdjkghfgjklhdgjklshjkhg' # os.environ['DJANGO_SECRET_KEY']

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = DEVELOP


DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ.get('DRIVER_DB_NAME', 'driver'),
        'HOST': os.environ.get('DRIVER_DB_HOST', 'localhost'),
        'PORT': os.environ.get('DRIVER_DB_PORT', 5432),
        'USER': os.environ.get('DRIVER_DB_USER', 'driver'),
        'PASSWORD': os.environ.get('DRIVER_DB_PASSWORD', 'driver'),
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
HOST_URL = os.environ.get('HOST_URL', 'https://titopop.com')

APPEND_SLASH=True