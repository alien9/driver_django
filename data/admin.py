from django.contrib import admin
from django.contrib.postgres.fields import JSONField
from django import forms
from django.utils.translation import gettext_lazy as _

from django_json_widget.widgets import JSONEditorWidget
from grout.widgets import GroutEditorWidget
from data.models import RecordCostConfig
from grout.models import RecordSchema, RecordType, Boundary, BoundaryPolygon
from black_spots.models import RoadMap

admin.site.index_title = _('My Index Title')


class RecordSchemaAdmin(admin.ModelAdmin):
    formfield_overrides = {
        JSONField: {'widget': GroutEditorWidget}
    }
#class RecordSchemaInline(admin.StackedInline):
#    model = RecordSchema
#    formfield_overrides = {
#        JSONField: {'widget': GroutEditorWidget}
#    }

class RecordTypeAdmin(admin.ModelAdmin):
    formfield_overrides = {
        JSONField: {'widget': JSONEditorWidget}
    }
#    inlines = [
#        RecordSchemaInline,
#    ]
class BoundaryAdmin(admin.ModelAdmin):
    class Meta:
        verbose_name_plural = "Boundaries"
class BoundaryPolygonAdmin(admin.ModelAdmin):
    pass
class RecordCostConfigAdmin(admin.ModelAdmin):
    pass

class RoadMapAdmin(admin.ModelAdmin):
    pass

admin.site.register(RecordSchema, RecordSchemaAdmin)
admin.site.register(RecordType, RecordTypeAdmin)
admin.site.register(Boundary, BoundaryAdmin)
admin.site.register(BoundaryPolygon, BoundaryPolygonAdmin)
admin.site.register(RecordCostConfig, RecordCostConfigAdmin)
admin.site.register(RoadMap, RoadMapAdmin)