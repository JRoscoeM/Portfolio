from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from fractions import Fraction
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Ingredient, Recipe


DISPLAY_PRECISION = Decimal("0.01")
MAX_FRACTION_DENOMINATOR = 16


@dataclass(frozen=True)
class ScaleContext:
    mode: str
    factor: Decimal
    original_serves: int | None = None
    target_serves: int | None = None
    anchor_ingredient_id: int | None = None
    anchor_name: str | None = None
    anchor_target_quantity: Decimal | None = None


def parse_amount_string(raw_amount: str | None) -> Decimal | None:
    """Convert a simple stored amount string into a Decimal when possible.

    Supports whole numbers, decimals, simple fractions like ``1/2``, and
    mixed numbers like ``1 1/2``. Returns ``None`` for blank or non-numeric
    text so callers can treat that ingredient as not directly scalable.
    """
    if not raw_amount:
        return None

    cleaned = raw_amount.strip()
    if not cleaned:
        return None

    try:
        return Decimal(cleaned)
    except InvalidOperation:
        pass

    if " " in cleaned:
        whole, maybe_fraction = cleaned.split(" ", 1)
        whole_amount = parse_amount_string(whole)
        fraction_amount = parse_amount_string(maybe_fraction)
        if whole_amount is not None and fraction_amount is not None:
            return whole_amount + fraction_amount

    if "/" in cleaned:
        numerator, denominator = cleaned.split("/", 1)
        try:
            return Decimal(numerator) / Decimal(denominator)
        except (InvalidOperation, ZeroDivisionError):
            return None

    return None


def get_base_quantity(ingredient: Ingredient) -> Decimal | None:
    """Return the canonical numeric quantity for an ingredient.

    Prefers the structured ``IngredientAmount.quantity`` value when present.
    Falls back to parsing the legacy ``Ingredient.amount`` text so older data
    can still participate in scaling before a full data migration is complete.
    """
    structured_amount = getattr(ingredient, "structured_amount", None)
    if structured_amount is not None and structured_amount.quantity is not None:
        return structured_amount.quantity

    return parse_amount_string(ingredient.amount)


def get_display_unit(ingredient: Ingredient) -> str:
    """Return the best unit string to show for an ingredient.

    Uses the structured unit first, then the legacy ingredient unit. This lets
    the UI move to ``IngredientAmount`` without breaking existing templates.
    """
    structured_amount = getattr(ingredient, "structured_amount", None)
    if structured_amount is not None and structured_amount.unit:
        return structured_amount.unit
    return ingredient.unit


def is_ingredient_scalable(ingredient: Ingredient) -> bool:
    """Determine whether an ingredient should be numerically scaled.

    Structured measurements respect the explicit ``is_scalable`` flag and
    require a stored quantity. Legacy ingredients are considered scalable only
    when their old ``amount`` text can be parsed into a numeric value.
    """
    structured_amount = getattr(ingredient, "structured_amount", None)
    if structured_amount is not None:
        return structured_amount.is_scalable and structured_amount.quantity is not None

    return parse_amount_string(ingredient.amount) is not None


def scale_quantity(quantity: Decimal, factor: Decimal) -> Decimal:
    """Multiply a quantity by a scale factor using display-safe precision.

    Quantizes to two decimal places so downstream formatting and template
    rendering do not carry long repeating decimal values.
    """
    return (quantity * factor).quantize(DISPLAY_PRECISION, rounding=ROUND_HALF_UP)


def format_quantity(quantity: Decimal | None) -> str:
    """Format a Decimal for human-readable recipe display.

    Whole numbers are shown without a decimal suffix, near-common fractions are
    rendered as kitchen-friendly strings like ``1/2`` or ``1 1/4``, and other
    values fall back to trimmed two-decimal output.
    """
    if quantity is None:
        return ""

    normalized = quantity.normalize()
    if normalized == normalized.to_integral():
        return str(normalized.quantize(Decimal("1")))

    fraction = Fraction(quantity).limit_denominator(MAX_FRACTION_DENOMINATOR)
    fraction_decimal = Decimal(fraction.numerator) / Decimal(fraction.denominator)
    if abs(quantity - fraction_decimal) <= Decimal("0.02"):
        whole = fraction.numerator // fraction.denominator
        remainder = fraction.numerator % fraction.denominator
        if remainder == 0:
            return str(whole)
        if whole:
            return f"{whole} {remainder}/{fraction.denominator}"
        return f"{remainder}/{fraction.denominator}"

    quantized = quantity.quantize(DISPLAY_PRECISION, rounding=ROUND_HALF_UP)
    text = format(quantized, "f")
    return text.rstrip("0").rstrip(".")


def calculate_servings_scale_factor(original_serves: int, target_serves: int) -> Decimal:
    """Compute the multiplier needed to move a recipe to a new serving count.

    Raises ``ValueError`` when either serving count is zero or negative so the
    calling view can reject invalid user input cleanly.
    """
    if original_serves <= 0:
        raise ValueError("Original serves must be greater than zero.")
    if target_serves <= 0:
        raise ValueError("Target serves must be greater than zero.")

    return Decimal(target_serves) / Decimal(original_serves)


def calculate_ingredient_scale_factor(
    ingredient: Ingredient,
    target_quantity: Decimal,
) -> Decimal:
    """Compute the multiplier needed to hit a desired quantity for one ingredient.

    The selected ingredient acts as the scaling anchor. Its base quantity is
    read from structured data first, then legacy text parsing. Raises
    ``ValueError`` if the target amount is invalid or the ingredient cannot be
    measured numerically.
    """
    if target_quantity <= 0:
        raise ValueError("Target quantity must be greater than zero.")

    base_quantity = get_base_quantity(ingredient)
    if base_quantity is None or base_quantity <= 0:
        raise ValueError("Ingredient must have a measurable base quantity.")

    return target_quantity / base_quantity


def build_scale_context_for_servings(recipe: Recipe, target_serves: int) -> ScaleContext:
    """Create a reusable scale context for serving-based scaling.

    Packages the derived scale factor together with the source and target
    serving counts so views and templates can explain the active scaling mode.
    """
    factor = calculate_servings_scale_factor(recipe.serves, target_serves)
    return ScaleContext(
        mode="servings",
        factor=factor,
        original_serves=recipe.serves,
        target_serves=target_serves,
    )


def build_scale_context_for_ingredient(
    ingredient: Ingredient,
    target_quantity: Decimal,
) -> ScaleContext:
    """Create a reusable scale context for ingredient-target scaling.

    Stores the chosen ingredient, the requested target quantity, and the
    resulting factor so the rest of the application can scale the recipe and
    describe why that factor was chosen.
    """
    factor = calculate_ingredient_scale_factor(ingredient, target_quantity)
    return ScaleContext(
        mode="ingredient",
        factor=factor,
        anchor_ingredient_id=ingredient.id,
        anchor_name=ingredient.name,
        anchor_target_quantity=target_quantity,
    )


def build_scaled_ingredient_payload(ingredient: Ingredient, factor: Decimal) -> dict:
    """Build a template-friendly ingredient payload with scaled values.

    The payload keeps both original and scaled representations so the UI can
    render either form, show comparisons, or gracefully fall back for
    ingredients that are not scalable.
    """
    base_quantity = get_base_quantity(ingredient)
    scalable = is_ingredient_scalable(ingredient)

    scaled_quantity = None
    scaled_amount_text = ingredient.amount

    if scalable and base_quantity is not None:
        scaled_quantity = scale_quantity(base_quantity, factor)
        scaled_amount_text = format_quantity(scaled_quantity)

    return {
        "id": ingredient.id,
        "name": ingredient.name,
        "unit": get_display_unit(ingredient),
        "original_amount_text": ingredient.amount,
        "original_quantity": base_quantity,
        "original_quantity_text": format_quantity(base_quantity) if base_quantity is not None else ingredient.amount,
        "scaled_quantity": scaled_quantity,
        "scaled_quantity_text": scaled_amount_text,
        "is_scalable": scalable,
        "display_text": " ".join(
            piece
            for piece in [scaled_amount_text, get_display_unit(ingredient), ingredient.name]
            if piece
        ).strip(),
    }


def build_scaled_recipe(recipe: Recipe, factor: Decimal) -> dict:
    """Build a full scaled recipe payload grouped by step.

    Iterates through each step and ingredient, applies the shared factor, and
    returns a structure that is ready for either the standard recipe page or a
    stripped-down cooking view.
    """
    steps_payload = []

    for step in recipe.steps.all():
        ingredient_payloads = [
            build_scaled_ingredient_payload(ingredient, factor)
            for ingredient in step.ingredients.all()
        ]
        steps_payload.append(
            {
                "id": step.id,
                "order": step.order,
                "description": step.description,
                "ingredients": ingredient_payloads,
            }
        )

    scaled_serves = None
    if getattr(recipe, "serves", None):
        scaled_serves = scale_quantity(Decimal(recipe.serves), factor)

    return {
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "original_serves": recipe.serves,
        "scaled_serves": int(scaled_serves) if scaled_serves is not None and scaled_serves == scaled_serves.to_integral() else scaled_serves,
        "scaled_serves_text": format_quantity(scaled_serves) if scaled_serves is not None else "",
        "factor": factor,
        "factor_text": format_quantity(factor),
        "steps": steps_payload,
    }
