from django.core.management.base import BaseCommand

from data.tasks import geocode_records


class Command(BaseCommand):
    help = 'Geocode the records'

    def handle(self, *args, **options):
        geocode_records()
