# Generated by Django 3.0.8 on 2021-03-29 17:37

import django.contrib.gis.db.models.fields
import django.contrib.postgres.fields.hstore
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0004_dictionary'),
    ]

    operations = [
        migrations.CreateModel(
            name='SegmentSet',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.TextField(max_length=200, null=True)),
            ],
            options={
                'verbose_name': 'Segment Set',
                'verbose_name_plural': 'Segment Sets',
            },
        ),
        migrations.CreateModel(
            name='Segment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('geom', django.contrib.gis.db.models.fields.LineStringField(blank=True, null=True, srid=4326)),
                ('name', models.TextField(max_length=200, null=True)),
                ('data', django.contrib.postgres.fields.hstore.HStoreField()),
                ('segment_set', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='data.SegmentSet')),
            ],
            options={
                'verbose_name': 'Segment',
                'verbose_name_plural': 'Segments',
            },
        ),
    ]