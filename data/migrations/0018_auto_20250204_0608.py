# Generated by Django 3.2.4 on 2025-02-03 22:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0017_auto_20250204_0603'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dictionary',
            name='about',
            field=models.TextField(blank=True, null=True, verbose_name='Text'),
        ),
        migrations.AlterField(
            model_name='dictionary',
            name='footer',
            field=models.TextField(blank=True, null=True, verbose_name='Footer'),
        ),
        migrations.AlterField(
            model_name='dictionary',
            name='header',
            field=models.TextField(blank=True, null=True, verbose_name='Header'),
        ),
    ]
