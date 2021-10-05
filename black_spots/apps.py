from django.apps import AppConfig
from django.utils.translation import ugettext_lazy as _

class CriticalAppConfig(AppConfig):
    name = 'black_spots'
    verbose_name = _('Critical Spots')