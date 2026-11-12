import re

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import Profile, Recipe, Tag


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
    """Dishbook lives under /recipes/ so www.roscoemoedl.com/recipes/ can proxy it."""

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
        self.assertIn('href="/recipes/static/main.css"', html)
        self.assertIn('src="/recipes/static/main.js"', html)
        self.assertIn(f'href="/recipes/recipe/{self.recipe.id}/cook/"', html)
        self.assertIn('href="/recipes/profile/cook/"', html)
        self.assertIn('src="/recipes/static/AI-slop_homepage.png"', html)
        # No link may point outside /recipes/, or it would leave Dishbook when proxied by the portfolio.
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

    def test_sign_in_and_out_stay_inside_dishbook(self):
        response = self.client.post(reverse("signin"), {"username": "cook", "password": "test-password"})
        self.assertRedirects(response, "/recipes/", fetch_redirect_response=False)
        response = self.client.get(reverse("signout"))
        self.assertRedirects(response, "/recipes/login", fetch_redirect_response=False)

    def test_sign_in_through_the_portfolio_domain_passes_csrf(self):
        # Proxied requests reach Django with this deployment's own host, while the browser sends
        # the portfolio as Origin. Without the portfolio in CSRF_TRUSTED_ORIGINS this post gets a 403.
        client = self.client_class(enforce_csrf_checks=True)
        page = client.get(reverse("signin"), HTTP_HOST="dishbook-recipes.vercel.app", secure=True)
        token = page.cookies["csrftoken"].value
        response = client.post(
            reverse("signin"),
            {"username": "cook", "password": "test-password", "csrfmiddlewaretoken": token},
            HTTP_HOST="dishbook-recipes.vercel.app",
            HTTP_ORIGIN="https://www.roscoemoedl.com",
            HTTP_REFERER="https://www.roscoemoedl.com/recipes/login",
            secure=True,
        )
        self.assertEqual(response.status_code, 302)
