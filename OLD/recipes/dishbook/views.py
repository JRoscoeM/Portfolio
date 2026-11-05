from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render

from .models import Profile, Recipe
from .scaling import (
    build_scale_context_for_ingredient,
    build_scale_context_for_servings,
    build_scaled_recipe,
    parse_amount_string,
)


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


def signin(request):
    # Assume there is no login error unless we discover one.
    error = False

    # If the user submitted the login form, process it.
    if request.method == "POST":
        # Read username and password from the submitted form data.
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")

        # Ask Django to check whether these credentials are valid.
        user = authenticate(request, username=username, password=password)

        # If authentication succeeds, log the user in and send them home.
        if user is not None:
            login(request, user)
            return redirect("/")

        # Otherwise, keep them on the login page and show an error message.
        error = True

    # For a normal GET request, or for a failed login attempt,
    # render the login page.
    return render(request, "login.html", {"error": error})


def signout(request):
    # Log out the current user.
    logout(request)

    # Send them back to the login page.
    return redirect("/login")
