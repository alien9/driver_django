from rest_framework.test import APIClient, APITestCase, APIRequestFactory
from grout.models import Boundary, BoundaryPolygon
from data.models import RecordType, RecordSchema, DriverRecord
import json
from rest_framework.test import APIClient, APITestCase, APIRequestFactory
from django.contrib.auth.models import User
from django.db import connection
"""
# this is runnable at shell_plus to connect to the test database
from django import test
test.utils.setup_test_environment() # Setup the environment
from django.db import connection
db = connection.creation.create_test_db() # Create the test db
"""
class GeoTestCase(APITestCase):
    def setUp(self):
        b=Boundary(
            uuid='14d606b2-59a4-4ee3-bceb-177d0e0a8ee8',status='COMPLETE', 
            label='Districts', color='#ff0000', data_fields='["ds_codigo", "ds_nome"]',
            display_field='ds_nome'
        )
        b.save()       
        b=Boundary(
            uuid='debb1dea-c69a-4e86-8df6-20eb5d9a931a',status='COMPLETE', label='Subs',
            color='#ff0000', data_fields='["sp_codigo", "sp_nome"]', display_field='sp_nome'
        )
        b.save()
        txt=open('data/tests/test_boundarypolygon.sql').read()
        with connection.cursor() as cursor: 
            cursor.execute(txt)

    def test_generic(self):
        #self.setUp()
        self.assertEqual(1,1)
        
