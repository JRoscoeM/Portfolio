from django.contrib import admin
from . import models

admin.site.register(models.Tag)
admin.site.register(models.Recipe)
admin.site.register(models.Step)
admin.site.register(models.Ingredient)
admin.site.register(models.IngredientAmount)
admin.site.register(models.Profile)
