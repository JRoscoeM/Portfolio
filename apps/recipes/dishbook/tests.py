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
