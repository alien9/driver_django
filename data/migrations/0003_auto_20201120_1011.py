# Generated by Django 3.0.8 on 2020-11-20 13:11

import django.contrib.gis.db.models.fields
import django.contrib.postgres.fields.hstore
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0002_delete_drivertemrecord'),
    ]

    operations = [
        migrations.CreateModel(
            name='RecordSegment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('geom', django.contrib.gis.db.models.fields.LineStringField(blank=True, null=True, srid=4326)),
                ('name', models.TextField(max_length=200, null=True)),
                ('data', django.contrib.postgres.fields.hstore.HStoreField()),
            ],
            options={
                'verbose_name': 'Record Segment',
                'verbose_name_plural': 'Record Segments',
            },
        ),
        migrations.AlterModelOptions(
            name='recordcostconfig',
            options={'verbose_name': 'Record Cost Config', 'verbose_name_plural': 'Record Cost Configs'},
        ),
        migrations.AddField(
            model_name='driverrecord',
            name='segment',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='data.RecordSegment'),
        ),
    ]