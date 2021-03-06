# Generated by Django 3.0.8 on 2021-03-29 17:42

import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('grout', '0029_auto_20201120_1011'),
        ('data', '0005_segment_segmentset'),
    ]

    operations = [
        migrations.AddField(
            model_name='segmentset',
            name='effective_end',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='segmentset',
            name='effective_start',
            field=models.DateTimeField(default=datetime.datetime(2021, 3, 29, 13, 41, 31, 176859)),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='segmentset',
            name='record_type',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.PROTECT, to='grout.RecordType'),
            preserve_default=False,
        ),
    ]
