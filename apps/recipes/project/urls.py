from django.contrib import admin
from django.http import HttpResponsePermanentRedirect, JsonResponse
from django.urls import include, path, re_path

# Dishbook is served under /recipes/ so the portfolio site (www.roscoemoedl.com) can proxy
# /recipes/* to this deployment. The same paths work on dishbook-recipes.vercel.app directly.
URL_PREFIX = "recipes/"


def health(request):
    return JsonResponse({"status": "ok", "service": "dishbook"})


def moved_to_prefix(request, rest=""):
    # Pages used to live at the site root; send old links and bookmarks to their new address.
    target = f"/{URL_PREFIX}{rest}"
    query = request.META.get("QUERY_STRING", "")
    return HttpResponsePermanentRedirect(f"{target}?{query}" if query else target)


urlpatterns = [
    path("healthz/", health, name="health"),
    path(f"{URL_PREFIX}admin/", admin.site.urls),
    path(URL_PREFIX, include("dishbook.urls")),
    re_path(r"^(?P<rest>(?:admin/.*|recipe/.*|profile/.*|s|login|logout)?)$", moved_to_prefix),
]
