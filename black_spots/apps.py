from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class CriticalAppConfig(AppConfig):
    name = 'black_spots'
    verbose_name = _('Critical Spots')