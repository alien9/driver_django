from django.core.management.base import BaseCommand

from data.tasks import generate_blackspots


class Command(BaseCommand):
    help = 'Generate the blackspotsets and blaclspots from the records'

    def handle(self, *args, **options):
        generate_blackspots()
