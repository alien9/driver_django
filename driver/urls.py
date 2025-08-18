from constance import config
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from user_filters import views as filt_views
from driver_auth import views as auth_views
from data import views as data_views
from black_spots import views as black_spot_views
import os
from rest_framework import routers
from django.conf import settings
from django.urls import re_path
from django.urls import include, path, re_path
from django.contrib import admin

from django.contrib import admin
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponseRedirect
from django.shortcuts import resolve_url
from django.urls import include, path, reverse
from django.utils.http import url_has_allowed_host_and_scheme

from two_factor.admin import AdminSiteOTPRequired, AdminSiteOTPRequiredMixin
from two_factor.urls import urlpatterns as tf_urls

class CustomAdminSiteOTPRequired(AdminSiteOTPRequired):
    def login(self, request, extra_context=None):
        redirect_to = request.POST.get(
            REDIRECT_FIELD_NAME, request.GET.get(REDIRECT_FIELD_NAME)
        )
        if request.method == "GET" and super(
            AdminSiteOTPRequiredMixin, self
        ).has_permission(request):
            if request.user.is_verified():
                index_path = reverse("admin:index", current_app=self.name)
            else:
                index_path = reverse("two_factor:setup", current_app=self.name)
            return HttpResponseRedirect(index_path)

        if not redirect_to or not url_has_allowed_host_and_scheme(
            url=redirect_to, allowed_hosts=[request.get_host()]
        ):
            redirect_to = resolve_url(settings.LOGIN_REDIRECT_URL)

        return redirect_to_login(redirect_to)


admin.site.__class__ = CustomAdminSiteOTPRequired
admin.autodiscover()
admin.site.enable_nav_sidebar = False

router = routers.DefaultRouter()
router.register('assignments', black_spot_views.EnforcerAssignmentViewSet)
router.register('audit-log', data_views.DriverRecordAuditLogViewSet)
router.register('blackspots', black_spot_views.BlackSpotViewSet,
                basename='blackspots')
router.register('blackspotsets',
                black_spot_views.BlackSpotSetViewSet, basename='blackspotsets')
router.register('blackspotconfig',
                black_spot_views.BlackSpotConfigViewSet, basename='blackspotconfig')
router.register('roadmaps', black_spot_views.RoadMapViewSet,
                basename='roadmaps')
router.register('boundaries', data_views.DriverBoundaryViewSet)
router.register('boundarypolygons', data_views.DriverBoundaryPolygonViewSet)
router.register('csv-export', data_views.RecordCsvExportViewSet,
                basename='csv-export')
router.register('duplicates', data_views.DriverRecordDuplicateViewSet)
router.register('records', data_views.DriverRecordViewSet)
router.register('recordschemas', data_views.DriverRecordSchemaViewSet)
router.register('recordtypes', data_views.DriverRecordTypeViewSet)
router.register('dictionaries', data_views.DictionaryViewSet)
router.register('recordcosts', data_views.DriverRecordCostConfigViewSet)
router.register('userfilters', filt_views.SavedFilterViewSet,
                basename='userfilters')
router.register('files', data_views.AttachmentViewSet, basename='files')

# user management
router.register(r'users', auth_views.UserViewSet)
router.register(r'groups', auth_views.GroupViewSet)

urlpatterns = i18n_patterns(
    path('admin/', admin.site.urls),
)

urlpatterns = [
    re_path(r'^admin/', admin.site.urls),
    path("", include(tf_urls)),
    path('accounts/', include('django.contrib.auth.urls')),
    re_path(r'^api/', include(router.urls)),
    re_path(r'^api/create-user/', auth_views.user_create),
    re_path(r'^editor/$', data_views.editor),
    re_path(r'^maps/(?P<geometry>[-\w]*)/(?P<mapfile>[-\w]*)/(?P<layer>[-\w\s]*)/(?P<z>\d*)/(?P<x>\d*)/(?P<y>\d*).png/$', data_views.maps),
    re_path(r'^grid/(?P<geometry>[-\w]*)/(?P<mapfile>[-\w]*)/(?P<layer>[-\w]*)/(?P<z>\d*)/(?P<x>\d*)/(?P<y>\d*).json/$', data_views.grid),
    re_path(r'^legend/(?P<layer>[-\w]*)/(?P<mapfile>[-\w]*)/$', data_views.legend),

    re_path(r'^mapillary_callback/$', data_views.mapillary_callback),

    re_path(r'^calculate_blackspots/(?P<uuid>[-\w]{0,100})/$',
        data_views.run_calculate_blackspots),
    re_path(r'^retrieve_blackspots/(?P<pk>[-\w]{0,100})/$',
        data_views.retrieve_blackspots),

    re_path(r'^dictionary/(?P<code>[-\w]*)/$', data_views.dictionary),
    re_path(r'^about/(?P<code>[-\w]*)/$', data_views.about),
    re_path(r'^dictionary/header/(?P<code>[-\w]*)/$', data_views.header),
    re_path(r'^dictionary/footer/(?P<code>[-\w]*)/$', data_views.footer),
    re_path(r'^dictionary/logo/(?P<code>[-\w]*)/$', data_views.logo),
    # get token for given username/password
    re_path(r'^api-token-auth/', auth_views.obtain_auth_token),
    re_path(r'^api/sso-token-auth/', auth_views.sso_auth_token),
    re_path(r'^openid/clientlist/', auth_views.get_oidc_client_list,
        name='openid_client_list'),
    re_path(r'^openid/googleclientid/', auth_views.get_google_client_id,
        name='get_google_client_id'),
    # override openid login callback endpoint by adding url here before djangooidc include
    re_path(r'^openid/callback/login/?$', auth_views.authz_cb, name='openid_login_cb'),
    # OIDC
    re_path(r'^oidc/', include('mozilla_django_oidc.urls')),
    re_path('i18n/', include('django.conf.urls.i18n')),
    re_path(r'^config/', data_views.get_config),
    re_path(r'^download/(?P<filename>[^\/]*)$', data_views.download),
    re_path('tiles/', data_views.proxy),
    re_path('mapserver/', data_views.mapserver),
    re_path(r'^get_config/', auth_views.get_config),
    re_path(r'^signup/', auth_views.signup),
    re_path(r'^photologue/', include('photologue.urls', namespace='photologue')),
    re_path(r'^api/escwa_unique_id/(?P<code>[-\w]*)/$', data_views.escwa_unique_id),
]

# i18n for django-admin

# Allow login to the browseable API
urlpatterns.append(
    re_path(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')))

if settings.DEBUG or settings.TESTING:
    import debug_toolbar
    urlpatterns = [
        re_path(r'^api/__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

urlpatterns += [
    path('captcha/', include('captcha.urls')),
]

urlpatterns += [
    path('ckeditor/', include('ckeditor_uploader.urls')),
    path("ckeditor5/", include('django_ckeditor_5.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


urlpatterns += [
    path('two_factor/', include(('admin_two_factor.urls', 'admin_two_factor'), namespace='two_factor')),
]
#urlpatterns += [
# path('', include(tf_urls)),
#]
admin.site.site_header = os.getenv("SITE_HEADER", f"{config.APP_NAME} Administration")
admin.site.site_title = os.getenv("SITE_TITLE", f"{config.APP_NAME} Administration")
admin.site.index_title = os.getenv("SITE_INDEX", f"{config.APP_NAME} Admin Start")


