# Generated by Django 3.2.4 on 2022-05-13 15:10

from django.db import migrations, models

sql_statement = open("find_segments.sql").read()

class Migration(migrations.Migration):

    dependencies = [
        ('black_spots', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(sql_statement),
        migrations.AddField(
            model_name='blackspotset',
            name='color',
            field=models.CharField(default='#ff0000', max_length=64),
        ),
    ]