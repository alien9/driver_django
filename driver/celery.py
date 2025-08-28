from __future__ import absolute_import

import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'driver.settings')

from django.conf import settings

app = Celery('driver')

app.config_from_object('django.conf:settings')
app.conf.result_backend = 'redis://172.17.0.1:6379/0'
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


