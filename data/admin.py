from django.contrib import admin
from django.db.models import JSONField
from django import forms
from django.utils.translation import gettext_lazy as _

from django_json_widget.widgets import JSONEditorWidget
from grout.widgets import GroutEditorWidget
from data.models import RecordCostConfig, Dictionary, Picture
from grout.models import RecordSchema, RecordType, Boundary, BoundaryPolygon
from black_spots.models import RoadMap, BlackSpotSet
from django_admin_hstore_widget.forms import HStoreFormField

admin.site.index_title = _('DRIVER Database')


class PictureAdmin(admin.ModelAdmin):
    pass

class RecordSchemaAdmin(admin.ModelAdmin):
    formfield_overrides = {
        JSONField: {'widget': GroutEditorWidget}
    }

class RecordTypeAdmin(admin.ModelAdmin):
    formfield_overrides = {
        JSONField: {'widget': JSONEditorWidget}
    }
def delete_selected(modeladmin, request, queryset):
    queryset.delete()

class BoundaryAdmin(admin.ModelAdmin):
    def render_delete_form(self, request, context):
        context['deleted_objects'] = [_('Object listing disabled')]
        print("trying to delete limites")
        return super(BoundaryAdmin, self).render_delete_form(request, context)
    
    def get_deleted_objects(self, queryset, request):
        print("eh aqui")
        return super(BoundaryAdmin, self).get_deleted_objects(queryset, request)

    def silent_delete(self, request, queryset):
        queryset.delete()

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

# class BoundaryPolygonAdmin(admin.ModelAdmin):
#     def render_delete_form(self, request, context):
#         context['deleted_objects'] = [_('Object listing disabled')]
#         print("trying to delete")
#         return super(BoundaryPolygonAdmin, self).render_delete_form(request, context)
class DictionaryAdminForm(forms.ModelForm):
    content = HStoreFormField()
    class Meta:
       model = Dictionary
       exclude = ()

class DictionaryAdmin(admin.ModelAdmin):
    form = DictionaryAdminForm
    content = HStoreFormField()

class RecordCostConfigAdminForm(forms.ModelForm):
    enum_costs = HStoreFormField()
    
    class Meta:
       model = RecordCostConfig
       exclude = ()

class RecordCostConfigAdmin(admin.ModelAdmin):
    form = RecordCostConfigAdminForm

class RoadMapAdmin(admin.ModelAdmin):
    def render_delete_form(self, request, context):
        context['deleted_objects'] = [_('Object listing disabled')]
        return super(RoadMapAdmin, self).render_delete_form(request, context)
    def get_deleted_objects(self, queryset, request):
        print("eh aqui")
        return super(RoadMapAdmin, self).get_deleted_objects(queryset, request)

    def silent_delete(self, request, queryset):
        queryset.delete()

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
        
class BlackSpotSetAdmin(admin.ModelAdmin):
    pass


admin.site.register(RecordSchema, RecordSchemaAdmin)
admin.site.register(RecordType, RecordTypeAdmin)
admin.site.register(Boundary, BoundaryAdmin)
admin.site.register(RecordCostConfig, RecordCostConfigAdmin)
admin.site.register(Dictionary, DictionaryAdmin)
admin.site.register(RoadMap, RoadMapAdmin)
admin.site.register(Picture, PictureAdmin)
admin.site.register(BlackSpotSet, BlackSpotSetAdmin)
