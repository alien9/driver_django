# Generated by Django 3.2.4 on 2021-08-27 05:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('black_spots', '0014_auto_20210826_2257'),
    ]

    operations = [
        migrations.AddField(
            model_name='blackspotset',
            name='display',
            field=models.BooleanField(default=True),
        ),
    ]