from django.core.management.base import BaseCommand

from data.tasks import create_indexes


class Command(BaseCommand):
    help = 'Generate the blackspotsets and blaclspots from the records'

    def handle(self, *args, **options):
        create_indexes()
