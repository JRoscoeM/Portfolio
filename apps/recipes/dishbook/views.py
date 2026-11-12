import logging
import secrets
from decimal import Decimal
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.crypto import constant_time_compare
from django.utils.http import url_has_allowed_host_and_scheme

from . import google_oauth
from .models import Profile, Recipe
from .scaling import (
    build_scale_context_for_ingredient,
    build_scale_context_for_servings,
    build_scaled_recipe,
    parse_amount_string,
)

logger = logging.getLogger(__name__)
GOOGLE_SESSION_KEY = "google_oauth_pending"


def index(request):
    # Start with public recipes only so logged-out users do not see private data.
    # select_related("author") tells Django to fetch the linked author data
    # at the same time, which helps avoid extra database queries in templates.
    recipes = Recipe.objects.filter(is_public=True).select_related("author")[:6]

    # Render the home page and give the template the recipes to display.
    return render(request, "index.html", {"recipes": recipes})


def _get_recipe_with_related_data(recipe_id, user):
    # Load a recipe and all related data the recipe and cooking views need.
    recipes = Recipe.objects.select_related("author").prefetch_related(
        "tags",
        "steps__ingredients__structured_amount",
    )
    if user.is_authenticated:
        selected_recipe = get_object_or_404(recipes, id=recipe_id)
        if not selected_recipe.is_public and selected_recipe.author_id != user.id:
            raise Http404
        return selected_recipe

    return get_object_or_404(recipes, id=recipe_id, is_public=True)


def _get_recipe_ingredient(recipe, ingredient_id):
    # Find one ingredient within the already-loaded recipe graph.
    for step in recipe.steps.all():
        for ingredient in step.ingredients.all():
            if ingredient.id == ingredient_id:
                return ingredient
    return None


def _build_scaling_context(request, recipe):
    # Read query-string scaling options and build a template-ready context.
    scale_mode = request.GET.get("scale_mode", "").strip()
    scale_context = None
    scaled_recipe = None
    scale_error = None

    if scale_mode == "servings":
        servings_value = request.GET.get("servings", "").strip()
        try:
            target_serves = int(servings_value)
            scale_context = build_scale_context_for_servings(recipe, target_serves)
        except (TypeError, ValueError):
            scale_error = "Enter a valid serving count greater than zero."

    elif scale_mode == "ingredient":
        ingredient_value = request.GET.get("ingredient_id", "").strip()
        target_amount_raw = request.GET.get("target_amount", "").strip()

        try:
            ingredient_id = int(ingredient_value)
            ingredient = _get_recipe_ingredient(recipe, ingredient_id)
            target_quantity = parse_amount_string(target_amount_raw)

            if ingredient is None:
                scale_error = "Choose an ingredient from this recipe."
            elif target_quantity is None:
                scale_error = "Enter a numeric target amount, like 14 or 1 1/2."
            else:
                scale_context = build_scale_context_for_ingredient(ingredient, target_quantity)
        except ValueError:
            scale_error = "Choose a valid ingredient and target amount."

    if scale_context is not None:
        scaled_recipe = build_scaled_recipe(recipe, scale_context.factor)

    return {
        "scale_context": scale_context,
        "scaled_recipe": scaled_recipe,
        "scale_error": scale_error,
    }


def _build_recipe_page_context(recipe):
    # Provide an always-unscaled payload for client-side scaling updates.
    return {
        "base_recipe_payload": build_scaled_recipe(recipe, Decimal("1")),
    }


def recipe(request, recipe_id):
    # Look up one recipe by its id and build optional scaling data.
    selected_recipe = _get_recipe_with_related_data(recipe_id, request.user)
    context = {"recipe": selected_recipe}
    context.update(_build_recipe_page_context(selected_recipe))
    context.update(_build_scaling_context(request, selected_recipe))

    # Send the selected recipe to the recipe detail template.
    return render(request, "recipe.html", context)


def cooking(request, recipe_id):
    # Render the distraction-free cooking view with the same scaling logic.
    selected_recipe = _get_recipe_with_related_data(recipe_id, request.user)
    context = {"recipe": selected_recipe}
    context.update(_build_scaling_context(request, selected_recipe))
    return render(request, "cooking.html", context)


def search(request):
    # Read the search query from the URL, like /s?q=toast.
    # If q is missing, use the empty string instead.
    q = request.GET.get("q", "").strip().lower()

    recipes = Recipe.objects.filter(is_public=True).select_related("author")

    valid_search_results = list()

    # Tag links on recipe cards search with "tag:<name>", which lists the recipes carrying that tag.
    if q.startswith("tag:"):
        tag_name = q[len("tag:"):].strip()
        valid_search_results = list(recipes.filter(tags__name__iexact=tag_name).distinct())
    else:
        for recipe in recipes:
            if q in recipe.__str__().lower():
                valid_search_results.insert(0, recipe)

    # Render the search page with both:
    # - the recipes to show
    # - the original query, so the search box can keep its value
    return render(request, "search.html", {"recipes": valid_search_results, "query": q})

def profile(request, username):
    # Find the user whose profile page we want to show.
    # If the username does not exist, return a 404 page.
    author = get_object_or_404(User, username=username)

    # Find that user's associated profile object.
    profile_data = get_object_or_404(Profile, user=author)

    # Show that user's public recipes on the profile page.
    recipes = Recipe.objects.filter(author=author, is_public=True).select_related("author")

    # Render the profile page with the user, profile, and recipes.
    return render(
        request,
        "profile.html",
        {
            "author": author,
            "profile": profile_data,
            "recipes": recipes,
        },
    )


SIGN_IN_ERRORS = {
    "cancelled": "Sign-in was cancelled.",
    "expired": "That sign-in attempt expired. Please try again.",
    "failed": "Google sign-in could not be completed. Please try again.",
    "unavailable": "Sign-in is not set up on this site yet.",
    "not_admin": "Your account does not have access to the admin.",
}


def _safe_next(value):
    # Only follow same-site paths, so the sign-in links cannot be used to bounce people elsewhere.
    if isinstance(value, str) and value.startswith("/") and url_has_allowed_host_and_scheme(value, allowed_hosts=None):
        return value
    return reverse("index")


def _public_url(request, path):
    origin = settings.COOKBOOK_PUBLIC_ORIGIN
    return f"{origin}{path}" if origin else request.build_absolute_uri(path)


def signin(request):
    next_path = _safe_next(request.GET.get("next"))
    error_code = request.GET.get("error", "")
    start = f"{reverse('google_login')}?{urlencode({'next': next_path})}"
    return render(
        request,
        "login.html",
        {
            "error": SIGN_IN_ERRORS.get(error_code, SIGN_IN_ERRORS["failed"]) if error_code else "",
            "google_login_url": _public_url(request, start),
            "sign_in_available": google_oauth.is_configured(),
        },
    )


def _sign_in_failed(code, next_path=None):
    query = {"error": code}
    if next_path:
        query["next"] = next_path
    return redirect(f"{reverse('signin')}?{urlencode(query)}")


def google_login(request):
    if not google_oauth.is_configured():
        return _sign_in_failed("unavailable")
    verifier, challenge = google_oauth.new_pkce_pair()
    state = secrets.token_urlsafe(32)
    # Kept in the visitor's session so only the browser that started sign-in can finish it.
    request.session[GOOGLE_SESSION_KEY] = {
        "state": state,
        "verifier": verifier,
        "next": _safe_next(request.GET.get("next")),
    }
    redirect_uri = _public_url(request, reverse("google_callback"))
    return redirect(google_oauth.authorize_url(redirect_uri, state, challenge))


def google_callback(request):
    pending = request.session.pop(GOOGLE_SESSION_KEY, None)
    supplied_state = request.GET.get("state", "")
    if not isinstance(pending, dict) or not constant_time_compare(supplied_state, pending.get("state", "")):
        return _sign_in_failed("expired")
    next_path = _safe_next(pending.get("next"))
    if request.GET.get("error"):
        return _sign_in_failed("cancelled", next_path)
    code = request.GET.get("code", "")
    if not code or len(code) > 2048:
        return _sign_in_failed("failed", next_path)

    try:
        profile = google_oauth.fetch_profile(
            code, _public_url(request, reverse("google_callback")), pending["verifier"]
        )
    except google_oauth.GoogleSignInError:
        logger.exception("Google sign-in failed")
        return _sign_in_failed("failed", next_path)

    user = google_oauth.user_for_profile(profile)
    login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return redirect(next_path)


def admin_login(request):
    """Replaces the admin's username/password form: admins sign in with Google like everyone else."""
    next_path = _safe_next(request.GET.get("next") or reverse("admin:index"))
    if request.user.is_authenticated:
        if request.user.is_staff:
            return redirect(next_path)
        return _sign_in_failed("not_admin")
    return redirect(f"{reverse('signin')}?{urlencode({'next': next_path})}")


def signout(request):
    # Log out the current user.
    logout(request)

    # Send them back to the login page.
    return redirect("signin")
