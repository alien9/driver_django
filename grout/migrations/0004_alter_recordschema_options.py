# Generated by Django 3.2.4 on 2025-01-09 00:40

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('grout', '0003_boundary_plural_label'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='recordschema',
            options={'ordering': ('record_type', '-version')},
        ),
    ]
