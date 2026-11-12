from django.contrib.auth.models import User
from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=40)

    def __str__(self):
        return self.name


class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    prep_time_minutes = models.IntegerField(default=0)
    cook_time_minutes = models.IntegerField(default=0)
    serves = models.IntegerField(default=1)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    photo = models.ImageField(upload_to="media/", null=True, blank=True)
    is_public = models.BooleanField(default=True)
    tags = models.ManyToManyField(Tag, blank=True)

    def total_time(self):
        return self.prep_time_minutes + self.cook_time_minutes

    def __str__(self):
        return self.title


class Step(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="steps")
    order = models.IntegerField()
    description = models.TextField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.recipe.title} step {self.order}"


class Ingredient(models.Model):
    step = models.ForeignKey(Step, on_delete=models.CASCADE, related_name="ingredients")
    amount = models.CharField(max_length=40)
    unit = models.CharField(max_length=40, blank=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        pieces = [self.amount, self.unit, self.name]
        return " ".join(piece for piece in pieces if piece).strip()


class IngredientAmount(models.Model):
    ingredient = models.OneToOneField(
        Ingredient,
        on_delete=models.CASCADE,
        related_name="structured_amount",
    )
    quantity = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=40, blank=True)
    is_scalable = models.BooleanField(default=True)
    package_quantity = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )
    package_unit = models.CharField(max_length=40, blank=True)

    def __str__(self):
        pieces = [self.quantity, self.unit, self.ingredient.name]
        return " ".join(str(piece) for piece in pieces if piece not in (None, "")).strip()


class GoogleAccount(models.Model):
    """Links a Django user to the Google account they sign in with."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="google_account")
    # Google's stable account id (the OpenID `sub` claim); unlike an email address it never changes.
    subject = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} (Google)"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="media/", null=True, blank=True)

    def __str__(self):
        return self.user.username
