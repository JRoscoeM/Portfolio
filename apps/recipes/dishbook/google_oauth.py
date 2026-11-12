"""Google sign-in (OAuth 2.0 authorization-code flow with PKCE) for the Group Cookbook.

Google only proves who the visitor is; the signed-in session is an ordinary Django session.
"""

import base64
import hashlib
import json
import secrets
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.utils.text import slugify

from .models import GoogleAccount, Profile

AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
REQUEST_TIMEOUT_SECONDS = 8


class GoogleSignInError(Exception):
    """Google refused the code, was unreachable, or returned no usable identity."""


def is_configured():
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def new_pkce_pair():
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    return verifier, challenge


def authorize_url(redirect_uri, state, code_challenge):
    query = urllib.parse.urlencode(
        {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "prompt": "select_account",
        }
    )
    return f"{AUTHORIZE_URL}?{query}"


def _request_json(url, data=None, headers=None):
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    request = urllib.request.Request(url, data=body, headers={"Accept": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode())
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        raise GoogleSignInError(f"Google request to {urllib.parse.urlsplit(url).netloc} failed") from error


def fetch_profile(code, redirect_uri, code_verifier):
    """Exchange the authorization code and return Google's OpenID profile for the account."""
    token = _request_json(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier,
        },
    )
    access_token = token.get("access_token") if isinstance(token, dict) else None
    if not access_token:
        raise GoogleSignInError("Google returned no access token")
    profile = _request_json(USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if not isinstance(profile, dict) or not isinstance(profile.get("sub"), str) or not profile["sub"]:
        raise GoogleSignInError("Google profile had no account id")
    return profile


def _verified_email(profile):
    email = profile.get("email")
    if profile.get("email_verified") is True and isinstance(email, str):
        return email.strip().lower()
    return ""


def _unique_username(profile, email):
    base = slugify(email.split("@")[0] if email else profile.get("name", "")) or "cook"
    base = base[:140]
    username, suffix = base, 2
    while User.objects.filter(username=username).exists():
        username = f"{base}-{suffix}"
        suffix += 1
    return username


@transaction.atomic
def user_for_profile(profile):
    """Return the Django user for a Google account, creating it on first sign-in.

    Accounts are keyed by Google's stable `sub` id. An address listed in COOKBOOK_ADMIN_EMAILS
    (verified by Google) is made a superuser, and on its first Google sign-in it takes over an
    existing user with that email, such as one made earlier with `createsuperuser`.
    """
    subject = profile["sub"]
    email = _verified_email(profile)
    is_admin = bool(email) and email in settings.COOKBOOK_ADMIN_EMAILS

    link = GoogleAccount.objects.select_related("user").filter(subject=subject).first()
    if link:
        user = link.user
    else:
        user = User.objects.filter(email__iexact=email).first() if is_admin else None
        if user is None:
            user = User(username=_unique_username(profile, email), email=email)
        user.first_name = str(profile.get("given_name") or "")[:150]
        user.last_name = str(profile.get("family_name") or "")[:150]
        user.set_unusable_password()
        user.save()
        GoogleAccount.objects.create(user=user, subject=subject)

    if is_admin and not (user.is_staff and user.is_superuser):
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=["is_staff", "is_superuser"])
    Profile.objects.get_or_create(user=user)
    return user
