# Generated by Django 3.2.4 on 2021-10-20 18:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0010_driverrecord_mapillary'),
    ]

    operations = [
        migrations.AlterField(
            model_name='driverrecord',
            name='mapillary',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AlterField(
            model_name='driverrecord',
            name='segment',
            field=models.ManyToManyField(blank=True, null=True, to='data.RecordSegment'),
        ),
    ]