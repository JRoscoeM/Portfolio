import re
from unittest import mock
from urllib.parse import parse_qs, urlsplit

from django.contrib.auth.models import User
from django.test import override_settings
from django.test import TestCase
from django.urls import reverse

from .models import GoogleAccount, Profile, Recipe, Tag


class PublicPageTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(username="cook", password="test-password")
        Profile.objects.create(user=self.author, bio="Test cook")
        self.public_recipe = Recipe.objects.create(
            title="Public Soup",
            description="Visible recipe",
            serves=2,
            author=self.author,
            is_public=True,
        )
        self.private_recipe = Recipe.objects.create(
            title="Private Soup",
            description="Hidden recipe",
            serves=2,
            author=self.author,
            is_public=False,
        )

    def test_health_check(self):
        response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "dishbook"})

    def test_home_page_shows_only_public_recipes(self):
        response = self.client.get(reverse("index"))

        self.assertContains(response, self.public_recipe.title)
        self.assertNotContains(response, self.private_recipe.title)

    def test_profile_shows_only_public_recipes(self):
        response = self.client.get(reverse("profile", args=[self.author.username]))

        self.assertContains(response, self.public_recipe.title)
        self.assertNotContains(response, self.private_recipe.title)

    def test_tag_search_lists_only_public_recipes_with_that_tag(self):
        tag = Tag.objects.create(name="Weeknight Dinner")
        self.public_recipe.tags.add(tag)
        self.private_recipe.tags.add(tag)
        untagged = Recipe.objects.create(
            title="Plain Toast", description="No tags", serves=1, author=self.author
        )

        response = self.client.get(reverse("search"), {"q": "tag:weeknight dinner"})

        self.assertContains(response, self.public_recipe.title)
        self.assertNotContains(response, self.private_recipe.title)
        self.assertNotContains(response, untagged.title)

    def test_title_search_still_matches_titles(self):
        response = self.client.get(reverse("search"), {"q": "public"})

        self.assertContains(response, self.public_recipe.title)
        self.assertNotContains(response, self.private_recipe.title)

    def test_private_recipe_is_hidden_from_anonymous_visitors(self):
        response = self.client.get(reverse("recipe", args=[self.private_recipe.id]))

        self.assertEqual(response.status_code, 404)

    def test_author_can_view_their_private_recipe(self):
        self.client.force_login(self.author)

        response = self.client.get(reverse("recipe", args=[self.private_recipe.id]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.private_recipe.title)


class UrlPrefixTests(TestCase):
    """Group Cookbook lives under /recipes/ so www.roscoemoedl.com/recipes/ can proxy it."""

    def setUp(self):
        self.author = User.objects.create_user(username="cook", password="test-password")
        Profile.objects.create(user=self.author)
        self.recipe = Recipe.objects.create(
            title="Prefixed Soup", description="Soup", serves=2, author=self.author
        )
        self.recipe.tags.add(Tag.objects.create(name="dinner"))

    def test_pages_are_served_under_the_prefix(self):
        self.assertEqual(reverse("index"), "/recipes/")
        self.assertEqual(reverse("recipe", args=[self.recipe.id]), f"/recipes/recipe/{self.recipe.id}/")

        response = self.client.get(reverse("recipe", args=[self.recipe.id]))
        html = response.content.decode()
        self.assertIn('href="/recipes/static/main.css?v=2"', html)
        self.assertIn('src="/recipes/static/main.js?v=2"', html)
        self.assertIn(f'href="/recipes/recipe/{self.recipe.id}/cook/"', html)
        self.assertIn('href="/recipes/profile/cook/"', html)
        # No link may point outside /recipes/, or it would leave Group Cookbook when proxied by the portfolio.
        for attribute in ("href", "src", "action"):
            for value in re.findall(rf'{attribute}="(/[^"]*)"', html):
                self.assertTrue(value.startswith("/recipes/"), f"{attribute}={value}")

    def test_old_root_urls_redirect_to_the_prefix(self):
        cases = {
            "/": "/recipes/",
            f"/recipe/{self.recipe.id}/": f"/recipes/recipe/{self.recipe.id}/",
            f"/recipe/{self.recipe.id}/cook/?scale_mode=servings&servings=4":
                f"/recipes/recipe/{self.recipe.id}/cook/?scale_mode=servings&servings=4",
            "/s?q=tag:dinner": "/recipes/s?q=tag:dinner",
            "/profile/cook/": "/recipes/profile/cook/",
            "/login": "/recipes/login",
            "/admin/": "/recipes/admin/",
        }
        for old, new in cases.items():
            response = self.client.get(old)
            self.assertEqual(response.status_code, 301, old)
            self.assertEqual(response["Location"], new, old)

    def test_unknown_paths_do_not_redirect_forever(self):
        self.assertEqual(self.client.get("/recipes/no-such-page/").status_code, 404)
        self.assertEqual(self.client.get("/no-such-page/").status_code, 404)


GOOGLE_SETTINGS = {
    "GOOGLE_CLIENT_ID": "client-id",
    "GOOGLE_CLIENT_SECRET": "client-secret",
    "COOKBOOK_ADMIN_EMAILS": {"owner@example.com"},
    "COOKBOOK_PUBLIC_ORIGIN": "https://www.roscoemoedl.com",
}


@override_settings(**GOOGLE_SETTINGS)
class GoogleSignInTests(TestCase):
    def start(self, next_path="/recipes/"):
        response = self.client.get(reverse("google_login"), {"next": next_path})
        self.assertEqual(response.status_code, 302)
        location = urlsplit(response["Location"])
        self.assertEqual(f"{location.scheme}://{location.netloc}{location.path}", "https://accounts.google.com/o/oauth2/v2/auth")
        return {key: values[0] for key, values in parse_qs(location.query).items()}

    def finish(self, params, profile, **query):
        calls = []

        def fake_google(url, data=None, headers=None):
            calls.append((url, data, headers))
            return {"access_token": "token"} if url.endswith("/token") else profile

        with mock.patch("dishbook.google_oauth._request_json", side_effect=fake_google):
            response = self.client.get(
                reverse("google_callback"), {"state": params["state"], "code": "auth-code", **query}
            )
        return response, calls

    def test_sign_in_page_offers_only_google(self):
        response = self.client.get(reverse("signin"))
        self.assertContains(response, "Sign in with Google")
        self.assertContains(response, 'href="https://www.roscoemoedl.com/recipes/login/google/?next=%2Frecipes%2F"')
        self.assertNotContains(response, 'type="password"')
        self.assertEqual(self.client.post(reverse("signin")).status_code, 200)
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_first_sign_in_creates_an_account_and_signs_in(self):
        params = self.start("/recipes/s")
        self.assertEqual(params["redirect_uri"], "https://www.roscoemoedl.com/recipes/login/google/callback/")
        self.assertEqual(params["code_challenge_method"], "S256")
        self.assertIn("openid", params["scope"])

        profile = {"sub": "111", "email": "Ada@Example.com", "email_verified": True, "given_name": "Ada", "family_name": "Lovelace"}
        response, calls = self.finish(params, profile)
        self.assertRedirects(response, "/recipes/s", fetch_redirect_response=False)
        self.assertEqual(calls[0][1]["code"], "auth-code")
        self.assertEqual(calls[0][1]["redirect_uri"], params["redirect_uri"])
        self.assertTrue(calls[0][1]["code_verifier"])

        user = GoogleAccount.objects.get(subject="111").user
        self.assertEqual((user.username, user.email, user.get_full_name()), ("ada", "ada@example.com", "Ada Lovelace"))
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.id)

        # Signing in again finds the same account rather than making another.
        self.client.logout()
        response, _ = self.finish(self.start(), profile)
        self.assertEqual(User.objects.filter(email="ada@example.com").count(), 1)
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.id)

    def test_usernames_stay_unique(self):
        User.objects.create_user(username="ada")
        self.finish(self.start(), {"sub": "222", "email": "ada@elsewhere.com", "email_verified": True})
        self.assertEqual(GoogleAccount.objects.get(subject="222").user.username, "ada-2")

    def test_admin_email_gets_the_admin_and_takes_over_the_existing_superuser(self):
        existing = User.objects.create_superuser(username="roscoe", email="owner@example.com", password="old-password")
        self.finish(self.start(), {"sub": "333", "email": "owner@example.com", "email_verified": True})
        existing.refresh_from_db()
        self.assertEqual(GoogleAccount.objects.get(subject="333").user, existing)
        self.assertTrue(existing.is_staff and existing.is_superuser)
        self.assertFalse(existing.has_usable_password())
        self.assertEqual(self.client.get("/recipes/admin/").status_code, 200)

    def test_unverified_admin_email_is_an_ordinary_account(self):
        existing = User.objects.create_superuser(username="roscoe", email="owner@example.com", password="old-password")
        self.finish(self.start(), {"sub": "444", "email": "owner@example.com", "email_verified": False})
        user = GoogleAccount.objects.get(subject="444").user
        self.assertNotEqual(user, existing)
        self.assertFalse(user.is_staff)

    def test_callback_rejects_a_forged_or_missing_state(self):
        self.start()
        response, calls = self.finish({"state": "forged"}, {"sub": "555"})
        self.assertEqual(response["Location"], "/recipes/login?error=expired")
        self.assertEqual(calls, [])
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_cancelled_and_failed_sign_ins_do_not_sign_in(self):
        response, _ = self.finish(self.start(), {"sub": "666"}, error="access_denied")
        self.assertTrue(response["Location"].startswith("/recipes/login?error=cancelled"))

        params = self.start()
        with mock.patch("dishbook.google_oauth._request_json", side_effect=__import__("dishbook.google_oauth").google_oauth.GoogleSignInError("down")), \
                self.assertLogs("dishbook.views", level="ERROR"):
            response = self.client.get(reverse("google_callback"), {"state": params["state"], "code": "auth-code"})
        self.assertTrue(response["Location"].startswith("/recipes/login?error=failed"))
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_next_cannot_send_people_off_site(self):
        params = self.start("//evil.example/steal")
        response, _ = self.finish(params, {"sub": "777", "email": "x@example.com", "email_verified": True})
        self.assertEqual(response["Location"], "/recipes/")

    def test_admin_login_goes_through_google(self):
        response = self.client.get("/recipes/admin/")
        self.assertEqual(response["Location"], "/recipes/admin/login/?next=/recipes/admin/")
        response = self.client.get(response["Location"])
        self.assertEqual(response["Location"], "/recipes/login?next=%2Frecipes%2Fadmin%2F")

        self.client.force_login(User.objects.create_user(username="cook"))
        response = self.client.get("/recipes/admin/login/?next=/recipes/admin/")
        self.assertEqual(response["Location"], "/recipes/login?error=not_admin")

    @override_settings(GOOGLE_CLIENT_ID="", GOOGLE_CLIENT_SECRET="")
    def test_sign_in_is_unavailable_until_configured(self):
        self.assertContains(self.client.get(reverse("signin")), "not set up")
        self.assertEqual(self.client.get(reverse("google_login"))["Location"], "/recipes/login?error=unavailable")


class ProxiedAdminFormTests(TestCase):
    def test_admin_form_posted_through_the_portfolio_domain_passes_csrf(self):
        # Proxied requests reach Django with this deployment's own host, while the browser sends the
        # portfolio as Origin. Without the portfolio in CSRF_TRUSTED_ORIGINS this post gets a 403.
        admin_user = User.objects.create_superuser(username="owner", email="owner@example.com")
        client = self.client_class(enforce_csrf_checks=True)
        client.force_login(admin_user)
        host = {"HTTP_HOST": "dishbook-recipes.vercel.app", "secure": True}
        page = client.get("/recipes/admin/dishbook/tag/add/", **host)
        self.assertEqual(page.status_code, 200)
        response = client.post(
            "/recipes/admin/dishbook/tag/add/",
            {"name": "Holiday", "csrfmiddlewaretoken": page.cookies["csrftoken"].value},
            HTTP_ORIGIN="https://www.roscoemoedl.com",
            **host,
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Tag.objects.filter(name="Holiday").exists())
