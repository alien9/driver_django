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
class ReportsTestCase(APITestCase):
    def setUp(self):
        self.client=APIClient()
        self.client.force_authenticate(user=User.objects.first())
        response=self.client.post('/api/recordtypes/', { 
            "geometry_type":"point",
            "label":'Crash',
            "plural_label":'Crashes'
            }, format='json')
        r=response.json()
        self.record_type_uuid=r['uuid']
        fu=open('data/tests/test_schema.json') 
        tu=fu.read()
        response=self.client.post('/api/recordschemas/', { 
            "record_type":self.record_type_uuid,
            "version":1,
            "schema":json.loads(tu)
        }, format='json')
        rt=response.json()

        fu=open('data/tests/test_records.json') 
        tu=fu.read()
        records=json.loads(tu)
        self.client.force_authenticate(user=User.objects.first())

        for record in records['results']:
            record['schema']=rt['uuid'] 
            self.client.post('/api/records/', record, format='json')   
        
    def setUpGeography(self):
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

    def test_filter_by_age(self):
        self.setUp()
        #self.setUpGeography()
        print("Testing reports...", end='')
        # 1 crash involves a minor
        response=self.client.get("/api/records/?archived=False&details_only=False&jsonb=%7B\"driverVictim\":%7B\"Age\":%7B\"_rule_type\":\"intrange_multiple\",\"min\":1,\"max\":7%7D%7D%7D&limit=50&occurred_max=2022-01-13T01:59:59.999Z&occurred_min=2021-10-14T02:00:00.000Z&record_type={record_type}".format(
                record_type=self.record_type_uuid
            )
        )
        print(".", end='')

        self.assertEqual(response.json()['count'], 1)
        # 2 crashes involv motorcycle
        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B%22driverVehicle%22:%7B%22Vehicle%20type%22:%7B%22_rule_type%22:%22containment_multiple%22,%22contains%22:%5B%22Motorcycle%22%5D%7D%7D%7D&occurred_min=2021-10-01T03:00:37.291Z&occurred_max=2022-01-11T03:00:37.291Z".format(
                record_type=self.record_type_uuid
            )
        )
        print("..", end='')
        self.assertEqual(response.json()['count'], 2)
        # 1 crash involves motorcycle(s) and a senior 44+
        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B\"driverVehicle\":%7B\"Vehicle%20type\":%7B\"_rule_type\":\"containment_multiple\",\"contains\":%5B\"Motorcycle\"%5D%7D%7D,\"driverVictim\":%7B\"Age\":%7B\"_rule_type\":\"intrange_multiple\",\"min\":44%7D%7D%7D&occurred_min=2021-10-01T03:00:14.733Z&occurred_max=2022-01-11T03:00:14.733Z&".format(
                record_type=self.record_type_uuid
            )
        )
        self.assertEqual(response.json()['count'], 1) 
        print(".", end='')
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&row_period_type=year&col_choices_path=driverAccidentDetails,properties,Accident%20type&jsonb=%7B%22driverVehicle%22:%7B%22Vehicle%20type%22:%7B%22_rule_type%22:%22containment_multiple%22,%22contains%22:%5B%22Motorcycle%22,%22Bus%22%5D%7D%7D,%22driverVictim%22:%7B%22Age%22:%7B%22_rule_type%22:%22intrange_multiple%22,%22max%22:80%7D%7D%7D&occurred_min=2021-10-01T03:00:21.183Z&occurred_max=2022-01-11T03:00:21.183Z&relate=".format(
                record_type=self.record_type_uuid
            )
        )
        j=response.json()
        self.assertTrue(j['tables'])
        print(".", end='')
        self.assertTrue(j['tables'][0]['data']['2021']['Collision'])
        print(".", end='')
        self.assertEqual(j['tables'][0]['data']['2021']['Collision'], 2)
        print(".", end='')

        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B%22driverVehicle%22:%7B%22Vehicle%20type%22:%7B%22_rule_type%22:%22containment_multiple%22,%22contains%22:%5B%22Bus%22,%22Motorcycle%22%5D%7D%7D%7D&occurred_min=2019-06-01T03:00:31.693Z&occurred_max=2022-01-14T03:00:31.693Z".format(
        record_type=self.record_type_uuid
            )
        )
        j=response.json()
        self.assertEqual(j['count'], 792)
        self.assertEqual(j['results'].length, 50)
        print(".", end='')
        #second page for this will have 
        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B%22driverVehicle%22:%7B%22Vehicle%20type%22:%7B%22_rule_type%22:%22containment_multiple%22,%22contains%22:%5B%22Bus%22,%22Motorcycle%22%5D%7D%7D%7D&occurred_min=2019-06-01T03:00:31.693Z&occurred_max=2022-01-14T03:00:31.693Z&offset=750".format(
        record_type=self.record_type_uuid
            )
        )
        j=response.json()
        self.assertEqual(j['results'].length, 42)
        print("Reports tested.")
