from mozilla_django_oidc.auth import OIDCAuthenticationBackend
from mozilla_django_oidc.views import OIDCAuthenticationRequestView, OIDCAuthenticationCallbackView, get_next_url
from rest_framework.authtoken.models import Token
from django.shortcuts import redirect
from driver_auth.permissions import (IsAdminOrReadSelfOnly, IsAdminOrReadOnly, is_admin_or_writer,
                                     is_admin)
from django.utils.crypto import get_random_string
from urllib.parse import quote
from mozilla_django_oidc.utils import (absolutify,add_state_and_nonce_to_session)
from django.urls import reverse
from urllib.parse import urlencode
from django.http import HttpResponseRedirect

USER_ID_COOKIE = 'AuthService.userId'
TOKEN_COOKIE = 'AuthService.token'
CAN_WRITE_COOKIE = 'AuthService.canWrite'
ADMIN_COOKIE = 'AuthService.isAdmin'

class OIDC_CallbackView(OIDCAuthenticationCallbackView):
    def get(self, request):
        r=super(OIDC_CallbackView, self).get(request)
        if self.user and self.user.is_active:
            token, created = Token.objects.get_or_create(user=self.user)
            # set session cookie for frontend
            r.set_cookie(USER_ID_COOKIE, token.user_id)
            # set cookie for frontend write access (will be false by default)
            if is_admin_or_writer(self.user):
                r.set_cookie(CAN_WRITE_COOKIE, 'true')
            if is_admin(self.user):
                r.set_cookie(ADMIN_COOKIE, 'true')
            r.set_cookie(TOKEN_COOKIE, quote('"' + token.key + '"', safe=''))
        return r

class OIDC_RequestView(OIDCAuthenticationRequestView):
    def get(self, request):
        """OIDC client authentication initialization HTTP endpoint"""
        state = get_random_string(self.get_settings('OIDC_STATE_SIZE', 32))
        redirect_field_name = self.get_settings('OIDC_REDIRECT_FIELD_NAME', 'next')
        reverse_url = self.get_settings('OIDC_AUTHENTICATION_CALLBACK_URL',
                                        'oidc_authentication_callback')

        params = {
            'response_type': 'code',
            'scope': self.get_settings('OIDC_RP_SCOPES', 'openid email'),
            'client_id': self.OIDC_RP_CLIENT_ID,
            'redirect_uri': absolutify(
                request,
                reverse(reverse_url)
            ),
            'state': state,
            'prompt': 'select_account',
        }

        params.update(self.get_extra_params(request))

        if self.get_settings('OIDC_USE_NONCE', True):
            nonce = get_random_string(self.get_settings('OIDC_NONCE_SIZE', 32))
            params.update({
                'nonce': nonce
            })

        add_state_and_nonce_to_session(request, state, params)

        request.session['oidc_login_next'] = get_next_url(request, redirect_field_name)

        query = urlencode(params)
        redirect_url = '{url}?{query}'.format(url=self.OIDC_OP_AUTH_ENDPOINT, query=query)
        print(redirect_url)
        return HttpResponseRedirect(redirect_url)
