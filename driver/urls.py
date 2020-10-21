from django.conf import settings
from django.conf.urls import url
from django.urls import include, path, re_path
from django.contrib import admin

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
router.register('temrecords', data_views.DriverTemRecordViewSet)
router.register('recordschemas', data_views.DriverRecordSchemaViewSet)
router.register('recordtypes', data_views.DriverRecordTypeViewSet)
router.register('recordcosts', data_views.DriverRecordCostConfigViewSet)
router.register('userfilters', filt_views.SavedFilterViewSet, basename='userfilters')


# user management
router.register(r'users', auth_views.UserViewSet)
router.register(r'groups', auth_views.GroupViewSet)

urlpatterns = [
    re_path(r'^admin/', admin.site.urls),
    url(r'^api/', include(router.urls)),
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
]

#urlpatterns += i18n_patterns(
#    url(r'^admin/', include(admin.site.urls)),
#)

# Allow login to the browseable API
urlpatterns.append(url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')))


if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        url(r'^api/__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

