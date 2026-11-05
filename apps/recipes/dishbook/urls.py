from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("recipe/<int:recipe_id>/", views.recipe, name="recipe"),
    path("recipe/<int:recipe_id>/cook/", views.cooking, name="cooking"),
    path("profile/<str:username>/", views.profile, name="profile"),
    path("s", views.search, name="search"),
    path("login", views.signin, name="signin"),
    path("logout", views.signout, name="signout"),
]
