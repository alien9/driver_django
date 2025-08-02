from django.contrib import admin
from django.db.models import JSONField
from django import forms
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html

from django_json_widget.widgets import JSONEditorWidget
from grout.widgets import GroutEditorWidget
from data.models import RecordCostConfig, Dictionary, DriverRecord
from grout.models import RecordSchema, RecordType, Boundary, BoundaryPolygon
from black_spots.models import RoadMap, BlackSpotSet
from django_admin_hstore_widget.forms import HStoreFormField
from constance import config
from django.forms import ModelForm
from django.forms.widgets import TextInput
from django.contrib.auth.models import User
from data.models import Irap
from django.contrib.auth.admin import UserAdmin
from ordered_model.admin import OrderedModelAdmin
from django_ckeditor_5.widgets import CKEditor5Widget
from ckeditor.widgets import CKEditorWidget
import json
from django.contrib import admin

#admin.site.unregister(Site)
#admin.site.index_title = _('DRIVER Database')


class DriverRecordAdminForm(ModelForm):
    class Meta:
        model = DriverRecord
        fields = '__all__'


class DriverRecordAdmin(admin.ModelAdmin):
    form = DriverRecordAdminForm

    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['mapillary_client_token'] = getattr(
            config, 'MAPILLARY_CLIENT_TOKEN')
        extra_context['mapillary_client_id'] = getattr(
            config, 'MAPILLARY_CLIENT_ID')
        extra_context['mapillary_secret'] = getattr(config, 'MAPILLARY_SECRET')
        return super().change_view(request, object_id, form_url, extra_context=extra_context,)


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


class BoundaryForm(ModelForm):
    class Meta:
        model = Boundary
        fields = '__all__'
        widgets = {
            'color': TextInput(attrs={'type': 'color'}),
        }


class BoundaryAdmin(OrderedModelAdmin):
    list_display = ('label', 'order', 'move_up_down_links')
    fields = ('label', 'plural_label', 'color', 'display_field',
              'data_fields', 'errors', 'source_file')
    form = BoundaryForm

    def render_delete_form(self, request, context):
        context['deleted_objects'] = [_('Object listing disabled')]

        return super(BoundaryAdmin, self).render_delete_form(request, context)

    def get_deleted_objects(self, queryset, request):

        return super(BoundaryAdmin, self).get_deleted_objects(queryset, request)

    def silent_delete(self, request, queryset):
        queryset.delete()

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

class DictionaryAdminForm(forms.ModelForm):
    content = HStoreFormField()
    about = forms.CharField(widget=CKEditorWidget())
    header = forms.CharField(widget=CKEditorWidget())
    footer = forms.CharField(widget=CKEditorWidget())
    logo = forms.CharField(widget=CKEditorWidget())

    class Meta:
        model = Dictionary
        exclude = ()
        

class DictionaryAdmin(admin.ModelAdmin):
    form = DictionaryAdminForm
    content = HStoreFormField()

    
    
def get_recordlcosts_fields_choices():
    r = RecordType.objects.filter(label=config.PRIMARY_LABEL)
    if not len(r):
        return []
    s = r[0].get_current_schema()
    if s is None:
        return []
    fus=[]
    a=get_recordcosts_choices()
    for table in a:
        for field in s.schema['definitions'][table[0]]['properties']:
            f=s.schema['definitions'][table[0]]['properties'][field]
            if 'enum' in f or f['type']=='integer': 
                fus.append([field,field])
    return fus

def get_recordcosts_choices():
    r = RecordType.objects.filter(label=config.PRIMARY_LABEL)
    if not len(r):
        return []
    s = r[0].get_current_schema()
    if s is None:
        return []
    return list(map(lambda x: [x, s.schema['definitions'][x]['title']], list(filter(lambda x: not s.schema['definitions'][x]['multiple'], list(s.schema['definitions'].keys())))))            

class RecordCostConfigAdminForm(forms.ModelForm):
    enum_costs = HStoreFormField()
    CHOICES=get_recordcosts_choices

    class Meta:
        model = RecordCostConfig
        exclude = ()
    content_type_key=forms.ChoiceField(choices=CHOICES)
    property_key=forms.ChoiceField(choices=get_recordlcosts_fields_choices)
    

class RecordCostConfigAdmin(admin.ModelAdmin):
    form = RecordCostConfigAdminForm
    def options_values(self, obj):
        r = RecordType.objects.filter(label=config.PRIMARY_LABEL)
        if not len(r):
            return {}
        s = r[0].get_current_schema()
        if s is None:
            return {}
        fus={}
        a=get_recordcosts_choices()
        for table in a:
            fus[table[0]]={}
            for field in s.schema['definitions'][table[0]]['properties'].keys():
                f=s.schema['definitions'][table[0]]['properties'][field]
                if 'enum' in f: #or f['type']=='integer': 
                    fus[table[0]][field]=f['enum']
                else:
                    fus[table[0]][field]=["Unitary cost"]
        return json.dumps(fus)
    readonly_fields = ['options_values']
    options_values.short_description = ""

    

class RoadMapAdmin(admin.ModelAdmin):
    def render_delete_form(self, request, context):
        context['deleted_objects'] = [_('Object listing disabled')]
        return super(RoadMapAdmin, self).render_delete_form(request, context)

    def get_deleted_objects(self, queryset, request):
        return super(RoadMapAdmin, self).get_deleted_objects(queryset, request)

    def silent_delete(self, request, queryset):
        queryset.delete()

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions


class IrapInline(admin.StackedInline):
    model = Irap


class BlackSpotSetForm(ModelForm):
    class Meta:
        model = BlackSpotSet
        fields = '__all__'
        widgets = {
            'color': TextInput(attrs={'type': 'color'}),
        }


class BlackSpotSetAdmin(admin.ModelAdmin):
    form = BlackSpotSetForm
    list_display = ("title",)

    def stats(self, obj: BlackSpotSet) -> str:
        return "%s spots detected" % (obj.blackspot_set.count())

    class Meta:
        model = BlackSpotSet
        fields = '__all__'


#class UserAdminDriver(UserAdmin):
#    inlines = UserAdmin.inlines + [IrapInline]


admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(RecordSchema, RecordSchemaAdmin)
admin.site.register(RecordType, RecordTypeAdmin)
admin.site.register(Boundary, BoundaryAdmin)
admin.site.register(RecordCostConfig, RecordCostConfigAdmin)
admin.site.register(Dictionary, DictionaryAdmin)
admin.site.register(RoadMap, RoadMapAdmin)
admin.site.register(BlackSpotSet, BlackSpotSetAdmin)
admin.site.register(DriverRecord, DriverRecordAdmin)
