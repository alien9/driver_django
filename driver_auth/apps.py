"""
Override app config to register signal for setting default user group on user creation.
"""
from django.apps import AppConfig
from django.conf import settings

READ_GROUP = settings.DRIVER_GROUPS['READ_ONLY']

def add_to_default_group(sender, **kwargs):
    user = kwargs["instance"]
    if kwargs["created"]:
        from django.contrib.auth.models import Group
        try:
            group = Group.objects.get(name=READ_GROUP)
        except:
            group=Group(name=READ_GROUP)
            group.save()
        user.groups.add(group)


class DriverConfig(AppConfig):
    name = 'driver_auth'
    verbose_name = 'Authentication and Permissions for DRIVER'
    def ready(self):
        from django.contrib.auth.models import User
        from django.db.models.signals import post_save
        post_save.connect(add_to_default_group, sender=User)
