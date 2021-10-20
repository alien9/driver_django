from django.conf import settings
from django.conf.urls import url
from django.urls import include, path, re_path
from django.contrib import admin
admin.autodiscover()
admin.site.enable_nav_sidebar = False
from rest_framework import routers

from black_spots import views as black_spot_views
from data import views as data_views
from driver_auth import views as auth_views
from user_filters import views as filt_views
from django.conf.urls.i18n import i18n_patterns

router = routers.DefaultRouter()
router.register('assignments', black_spot_views.EnforcerAssignmentViewSet)
router.register('audit-log', data_views.DriverRecordAuditLogViewSet)
router.register('blackspots', black_spot_views.BlackSpotViewSet, basename='blackspots')
router.register('blackspotsets', black_spot_views.BlackSpotSetViewSet, basename='blackspotsets')
router.register('blackspotconfig', black_spot_views.BlackSpotConfigViewSet, basename='blackspotconfig')
router.register('boundaries', data_views.DriverBoundaryViewSet)
router.register('boundarypolygons', data_views.DriverBoundaryPolygonViewSet)
router.register('csv-export', data_views.RecordCsvExportViewSet, basename='csv-export')
router.register('duplicates', data_views.DriverRecordDuplicateViewSet)
router.register('jars', data_views.AndroidSchemaModelsViewSet, basename='jars')
router.register('records', data_views.DriverRecordViewSet)
router.register('recordschemas', data_views.DriverRecordSchemaViewSet)
router.register('recordtypes', data_views.DriverRecordTypeViewSet)
router.register('dictionaries', data_views.DictionaryViewSet)
router.register('recordcosts', data_views.DriverRecordCostConfigViewSet)
router.register('userfilters', filt_views.SavedFilterViewSet, basename='userfilters')
router.register('pictures', data_views.PictureViewSet, basename='pictures')


# user management
router.register(r'users', auth_views.UserViewSet)
router.register(r'groups', auth_views.GroupViewSet)

urlpatterns = i18n_patterns(
    path('admin/', admin.site.urls),
)


urlpatterns = [
    re_path(r'^admin/', admin.site.urls),
    url(r'^api/', include(router.urls)),
    url(r'^/', data_views.index),
    url(r'^$', data_views.index),
    url(r'^editor/$', data_views.editor),
    url(r'^maps/(?P<geometry>[-\w]*)/(?P<mapfile>[-\w]*)/(?P<layer>[-\w]*)/(?P<z>\d*)/(?P<x>\d*)/(?P<y>\d*).png/$', data_views.maps),
    url(r'^grid/(?P<geometry>[-\w]*)/(?P<mapfile>[-\w]*)/(?P<layer>[-\w]*)/(?P<z>\d*)/(?P<x>\d*)/(?P<y>\d*).json/$', data_views.grid),
    
    url(r'^calculate_blackspots/(?P<uuid>[-\w]{0,100})/$', data_views.run_calculate_blackspots),
    url(r'^retrieve_blackspots/(?P<pk>[-\w]{0,100})/$', data_views.retrieve_blackspots),

    url(r'^dictionary/(?P<code>\w*)/$', data_views.dictionary),

    # get token for given username/password
    url(r'^api-token-auth/', auth_views.obtain_auth_token),
    url(r'^api/sso-token-auth/', auth_views.sso_auth_token),
    url(r'^openid/clientlist/', auth_views.get_oidc_client_list, name='openid_client_list'),
    # override openid login callback endpoint by adding url here before djangooidc include
    url(r'^openid/callback/login/?$', auth_views.authz_cb, name='openid_login_cb'),
    # OIDC
    #url(r'^openid/', include('djangooidc.urls')),
    #url(r'openid/', include('djangooidc.urls')),    
    url(r'^oidc/', include('mozilla_django_oidc.urls')),
    url('i18n/', include('django.conf.urls.i18n')),
    url(r'^config/', data_views.get_config),
    url('tiles/', data_views.proxy),
    url('mapserver/', data_views.mapserver),
    url('mapcache/', data_views.mapcache),
    url('segments/', data_views.segment_sets),
]


from django.conf.urls.i18n import i18n_patterns

# Allow login to the browseable API
urlpatterns.append(url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')))
if settings.DEBUG or settings.TESTING:
    import debug_toolbar
    urlpatterns = [
        url(r'^api/__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

