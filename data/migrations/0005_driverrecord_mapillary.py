# Generated by Django 3.2.4 on 2022-03-29 13:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0004_remove_driverrecord_mapillary'),
    ]

    operations = [
        migrations.AddField(
            model_name='driverrecord',
            name='mapillary',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='data.mapillarydata'),
        ),
    ]
