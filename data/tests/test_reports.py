from rest_framework.test import APIClient, APITestCase, APIRequestFactory
from grout.models import Boundary, BoundaryPolygon
from data.models import RecordType, RecordSchema, DriverRecord
import json
from rest_framework.test import APIClient, APITestCase, APIRequestFactory
from django.contrib.auth.models import User, Group
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
        us=User.objects.filter(username='admin')
        if not len(us):
            u=User(username='admin')
            u.save()
        else:
            u=us[0]
        u.groups.add(Group.objects.filter(name='admin')[0])
        u.save()
        self.client=APIClient()
        self.client.force_authenticate(user=u)
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
            response=self.client.post('/api/records/', record, format='json')

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
        
        
        # 2 crash involves a minor
        response=self.client.get("/api/records/?archived=False&details_only=False&jsonb=%7B\"driverVictim\":%7B\"Age\":%7B\"_rule_type\":\"intrange_multiple\",\"max\":17%7D%7D%7D&limit=50&occurred_max=2022-01-13T01:59:59.999Z&occurred_min=2021-10-14T02:00:00.000Z&record_type={record_type}".format(
                record_type=self.record_type_uuid
            )
        )
        print(".", end='')
        print(response.json())

        self.assertEqual(response.json()['count'], 2)
        # 5 crashes involv motorcycle(s)
        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B%22driverVehicle%22:%7B%22Vehicle%20type%22:%7B%22_rule_type%22:%22containment_multiple%22,%22contains%22:%5B%22Motorcycle%22%5D%7D%7D%7D&occurred_min=2021-10-01T03:00:37.291Z&occurred_max=2022-01-11T03:00:37.291Z".format(
                record_type=self.record_type_uuid
            )
        )
        print("..", end='')
        self.assertEqual(response.json()['count'], 5)
        # 2 crash involves motorcycle(s) and a senior 44+
        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B\"driverVehicle\":%7B\"Vehicle%20type\":%7B\"_rule_type\":\"containment_multiple\",\"contains\":%5B\"Motorcycle\"%5D%7D%7D,\"driverVictim\":%7B\"Age\":%7B\"_rule_type\":\"intrange_multiple\",\"min\":44%7D%7D%7D&occurred_min=2021-10-01T03:00:14.733Z&occurred_max=2022-01-11T03:00:14.733Z&".format(
                record_type=self.record_type_uuid
            )
        )
        self.assertEqual(response.json()['count'], 2) 
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

        # 3 crashes involving bus and motorcycle
        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B%22driverVehicle%22:%7B%22Vehicle%20type%22:%7B%22_rule_type%22:%22containment_multiple%22,%22contains%22:%5B%22Bus%22,%22Motorcycle%22%5D%7D%7D%7D&occurred_min=2019-06-01T03:00:31.693Z&occurred_max=2022-01-14T03:00:31.693Z".format(
        record_type=self.record_type_uuid
            )
        )
        j=response.json()
        self.assertEqual(j['count'], 5)
        self.assertEqual(len(j['results']), 5)
        print(".", end='')
        #second page for this will have 
        response=self.client.get("/api/records/?archived=false&details_only=false&limit=50&record_type={record_type}&active=true&jsonb=%7B%22driverVehicle%22:%7B%22Vehicle%20type%22:%7B%22_rule_type%22:%22containment_multiple%22,%22contains%22:%5B%22Bus%22,%22Motorcycle%22%5D%7D%7D%7D&occurred_min=2019-06-01T03:00:31.693Z&occurred_max=2022-01-14T03:00:31.693Z&offset=750".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()
        self.assertEqual(len(j['results']), 0)
        print("Reports tested.")

    def test_reports(self):
        # type of crash by the year
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&jsonb=%7B%7D&occurred_min=2013-10-02T03:00:19.711Z&occurred_max=2022-01-13T03:00:19.711Z&row_period_type=year&col_choices_path=driverAccidentDetails,properties,Accident%20type&relate=driverAccidentDetails,properties,Accident%20type".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()
        self.assertEqual(j['tables'][0]['data']['2021']['Shock'], 3)
        self.assertEqual(j['tables'][0]['data']['2021']['Collision'], 4)
        #type of crash complete period
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&jsonb=%7B%7D&occurred_min=2013-10-02T03:00:19.711Z&occurred_max=2022-01-13T03:00:19.711Z&row_period_type=all&col_choices_path=driverAccidentDetails,properties,Accident%20type&relate=driverAccidentDetails,properties,Accident%20type".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()
        self.assertEqual(j['tables'][0]['data']['0']['Collision'], 4)
        
        #type of crash complete period only for 1st half of Dec 2021
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&jsonb=%7B%7D&occurred_min=2021-12-01T00:00:00.711Z&occurred_max=2021-12-14T23:59:19.711Z&row_period_type=all&col_choices_path=driverAccidentDetails,properties,Accident%20type&relate=driverAccidentDetails,properties,Accident%20type".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()
        self.assertEqual(j['tables'][0]['data']['0']['Collision'], 3)
        self.assertEqual(j['tables'][0]['data']['0']['Others'], 1)

        #type of crash organized by row
        # count of vehicles
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&jsonb=%7B%7D&col_period_type=all&row_choices_path=driverAccidentDetails,properties,Accident%20type&relate=driverAccidentDetails,properties,Accident%20type".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()

        self.assertEqual(j['tables'][0]['data']['Collision']['0'], 4)
        self.assertEqual(j['tables'][0]['data']['Others']['0'], 1)
        self.assertEqual(j['tables'][0]['row_totals']['Shock'], 3)


        # count of vehicles
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&jsonb=%7B%7D&occurred_min=2018-01-26T02:00:59.818Z&occurred_max=2022-01-31T03:00:59.818Z&row_period_type=year&col_choices_path=driverVehicle,properties,Vehicle%20type&relate=driverVehicle,properties,Vehicle%20type".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()
        self.assertEqual(j['tables'][0]['data']['2021']['Motorcycle'], 6) 
        self.assertEqual(j['tables'][0]['row_totals']['2021'], 8)

        # count of crashes for every kind of vehicle
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&jsonb=%7B%7D&occurred_min=2018-01-26T02:00:59.818Z&occurred_max=2022-01-31T03:00:59.818Z&row_period_type=year&col_choices_path=driverVehicle,properties,Vehicle%20type&".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()
        self.assertEqual(j['tables'][0]['data']['2021']['Motorcycle'], 5)
        
        # count of crashes for every kind of vehicle - not grouped by year
        response=self.client.get("/api/records/crosstabs/?archived=False&record_type={record_type}&calendar=gregorian&jsonb=%7B%7D&occurred_min=2018-01-26T02:00:59.818Z&occurred_max=2022-01-31T03:00:59.818Z&row_period_type=all&col_choices_path=driverVehicle,properties,Vehicle%20type&".format(
            record_type=self.record_type_uuid
                )
            )
        j=response.json()
        self.assertEqual(j['tables'][0]['data']['0']['Motorcycle'], 5)
        self.assertEqual(j['tables'][0]['row_totals']['0'], 7)
        print(j)