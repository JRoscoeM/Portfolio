// All api/_lib/*.js is server-side code used by Vercel API functions.
// They can safely touch stuff like process.env.DATABASE_URL

(function () {
    const recipeDataScript = document.getElementById("recipe-base-data");
    if (!recipeDataScript) {
        return;
    }

    const baseRecipe = JSON.parse(recipeDataScript.textContent);
    const ingredientList = document.getElementById("ingredient-list");
    const stepList = document.getElementById("step-list");
    const servesValue = document.getElementById("recipe-serves-value");
    const scaleSummary = document.getElementById("scale-summary");
    const scaleSummaryText = document.getElementById("scale-summary-text");
    const scaleFactorChip = document.getElementById("scale-factor-chip");
    const scaleError = document.getElementById("scale-error");
    const cookViewLink = document.getElementById("cook-view-link");
    const servingsForm = document.getElementById("servings-scale-form");
    const ingredientForm = document.getElementById("ingredient-scale-form");
    const servingsInput = document.getElementById("servings");
    const ingredientSelect = document.getElementById("ingredient_id");
    const targetAmountInput = document.getElementById("target_amount");
    const recipeId = baseRecipe.id;

    const DISPLAY_PRECISION = 100;
    const MAX_FRACTION_DENOMINATOR = 16;

    function gcd(a, b) {
        while (b) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    function parseAmountString(rawAmount) {
        if (!rawAmount) {
            return null;
        }

        const cleaned = rawAmount.trim();
        if (!cleaned) {
            return null;
        }

        const directNumber = Number(cleaned);
        if (!Number.isNaN(directNumber)) {
            return directNumber;
        }

        if (cleaned.includes(" ")) {
            const pieces = cleaned.split(" ", 2);
            const whole = parseAmountString(pieces[0]);
            const fraction = parseAmountString(pieces[1]);
            if (whole !== null && fraction !== null) {
                return whole + fraction;
            }
        }

        if (cleaned.includes("/")) {
            const parts = cleaned.split("/", 2);
            const numerator = Number(parts[0]);
            const denominator = Number(parts[1]);
            if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
                return numerator / denominator;
            }
        }

        return null;
    }

    function formatQuantity(quantity) {
        if (quantity === null || quantity === undefined || Number.isNaN(quantity)) {
            return "";
        }

        if (Math.abs(quantity - Math.round(quantity)) < 0.001) {
            return String(Math.round(quantity));
        }

        const rounded = Math.round(quantity * DISPLAY_PRECISION) / DISPLAY_PRECISION;
        for (let denominator = 2; denominator <= MAX_FRACTION_DENOMINATOR; denominator += 1) {
            const numerator = Math.round(rounded * denominator);
            const approximation = numerator / denominator;
            if (Math.abs(rounded - approximation) <= 0.02) {
                const whole = Math.floor(numerator / denominator);
                const remainder = numerator % denominator;
                if (remainder === 0) {
                    return String(whole);
                }
                const commonDivisor = gcd(remainder, denominator);
                const simplifiedNumerator = remainder / commonDivisor;
                const simplifiedDenominator = denominator / commonDivisor;
                if (whole > 0) {
                    return `${whole} ${simplifiedNumerator}/${simplifiedDenominator}`;
                }
                return `${simplifiedNumerator}/${simplifiedDenominator}`;
            }
        }

        return rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    }

    function scaleQuantity(quantity, factor) {
        return Math.round(quantity * factor * DISPLAY_PRECISION) / DISPLAY_PRECISION;
    }

    function getBaseQuantity(ingredient) {
        if (ingredient.original_quantity !== null && ingredient.original_quantity !== undefined && ingredient.original_quantity !== "") {
            return Number(ingredient.original_quantity);
        }
        return parseAmountString(ingredient.original_amount_text);
    }

    function buildScaledRecipe(factor) {
        const scaledServes = scaleQuantity(Number(baseRecipe.original_serves), factor);
        return {
            factor,
            factorText: formatQuantity(factor),
            scaledServesText: formatQuantity(scaledServes),
            steps: baseRecipe.steps.map((step) => ({
                ...step,
                ingredients: step.ingredients.map((ingredient) => {
                    const baseQuantity = getBaseQuantity(ingredient);
                    let scaledQuantity = null;
                    let scaledQuantityText = ingredient.original_amount_text;

                    if (ingredient.is_scalable && baseQuantity !== null) {
                        scaledQuantity = scaleQuantity(baseQuantity, factor);
                        scaledQuantityText = formatQuantity(scaledQuantity);
                    }

                    const unit = ingredient.unit || "";
                    const displayParts = [scaledQuantityText, unit, ingredient.name].filter(Boolean);

                    return {
                        ...ingredient,
                        scaledQuantity,
                        scaledQuantityText,
                        displayText: displayParts.join(" ").trim(),
                    };
                }),
            })),
        };
    }

    function renderIngredientList(scaledRecipe) {
        ingredientList.innerHTML = "";

        scaledRecipe.steps.forEach((step) => {
            step.ingredients.forEach((ingredient) => {
                const listItem = document.createElement("li");
                const mainText = document.createElement("span");
                mainText.textContent = ingredient.displayText;
                listItem.appendChild(mainText);

                if (ingredient.original_quantity_text !== ingredient.scaledQuantityText) {
                    const originalText = document.createElement("small");
                    originalText.textContent = `Original: ${ingredient.original_quantity_text} ${ingredient.unit || ""}`.trim();
                    listItem.appendChild(originalText);
                }

                ingredientList.appendChild(listItem);
            });
        });
    }

    function renderStepList(scaledRecipe) {
        stepList.innerHTML = "";

        scaledRecipe.steps.forEach((step) => {
            const listItem = document.createElement("li");
            listItem.className = "step-card";

            const textWrapper = document.createElement("div");
            const stepTitle = document.createElement("strong");
            stepTitle.textContent = `Step ${step.order}`;
            const stepDescription = document.createElement("p");
            stepDescription.textContent = step.description;
            textWrapper.appendChild(stepTitle);
            textWrapper.appendChild(stepDescription);
            listItem.appendChild(textWrapper);

            if (step.ingredients.length > 0) {
                const stepIngredients = document.createElement("div");
                stepIngredients.className = "step-ingredients";

                const label = document.createElement("span");
                label.className = "step-ingredients-label";
                label.textContent = "Use in this step";
                stepIngredients.appendChild(label);

                const ingredientItems = document.createElement("ul");
                step.ingredients.forEach((ingredient) => {
                    const ingredientItem = document.createElement("li");
                    ingredientItem.textContent = ingredient.displayText;
                    ingredientItems.appendChild(ingredientItem);
                });
                stepIngredients.appendChild(ingredientItems);
                listItem.appendChild(stepIngredients);
            }

            stepList.appendChild(listItem);
        });
    }

    function showError(message) {
        if (!message) {
            scaleError.textContent = "";
            scaleError.classList.add("is-hidden");
            return;
        }

        scaleError.textContent = message;
        scaleError.classList.remove("is-hidden");
    }

    function hideSummary() {
        scaleSummary.classList.add("is-hidden");
        scaleFactorChip.classList.add("is-hidden");
    }

    function updateCookLink(params) {
        const basePath = `/recipe/${recipeId}/cook/`;
        const query = params.toString();
        cookViewLink.href = query ? `${basePath}?${query}` : basePath;
    }

    function renderBaseRecipe() {
        renderIngredientList(buildScaledRecipe(1));
        renderStepList(buildScaledRecipe(1));
        servesValue.textContent = String(baseRecipe.original_serves);
        hideSummary();
        showError("");
        updateCookLink(new URLSearchParams());
    }

    function renderScaledRecipe(scaledRecipe, summaryText) {
        renderIngredientList(scaledRecipe);
        renderStepList(scaledRecipe);
        servesValue.textContent = scaledRecipe.scaledServesText;
        scaleSummaryText.textContent = summaryText;
        scaleFactorChip.textContent = `factor ×${scaledRecipe.factorText}`;
        scaleSummary.classList.remove("is-hidden");
        scaleFactorChip.classList.remove("is-hidden");
        showError("");
    }

    function applyServingsScaling() {
        const targetServes = Number(servingsInput.value);
        if (!targetServes) {
            renderBaseRecipe();
            return;
        }
        if (targetServes < 1) {
            showError("Enter a valid serving count greater than zero.");
            return;
        }

        const factor = targetServes / Number(baseRecipe.original_serves);
        const scaledRecipe = buildScaledRecipe(factor);
        renderScaledRecipe(
            scaledRecipe,
            `scaled from ${baseRecipe.original_serves} servings to ${targetServes} servings`
        );

        const params = new URLSearchParams();
        params.set("scale_mode", "servings");
        params.set("servings", String(targetServes));
        updateCookLink(params);
    }

    function applyIngredientScaling() {
        const ingredientId = ingredientSelect.value;
        const targetQuantity = parseAmountString(targetAmountInput.value);

        if (!ingredientId && !targetAmountInput.value.trim()) {
            renderBaseRecipe();
            return;
        }

        const selectedIngredient = baseRecipe.steps
            .flatMap((step) => step.ingredients)
            .find((ingredient) => String(ingredient.id) === ingredientId);

        if (!selectedIngredient) {
            showError("Choose an ingredient from this recipe.");
            return;
        }

        if (targetQuantity === null || targetQuantity <= 0) {
            showError("Enter a numeric target amount, like 14 or 1 1/2.");
            return;
        }

        const baseQuantity = getBaseQuantity(selectedIngredient);
        if (baseQuantity === null || baseQuantity <= 0 || !selectedIngredient.is_scalable) {
            showError("That ingredient does not have a scalable base amount yet.");
            return;
        }

        const factor = targetQuantity / baseQuantity;
        const scaledRecipe = buildScaledRecipe(factor);
        renderScaledRecipe(
            scaledRecipe,
            `scaled to match ${formatQuantity(targetQuantity)} of ${selectedIngredient.name}`
        );

        const params = new URLSearchParams();
        params.set("scale_mode", "ingredient");
        params.set("ingredient_id", ingredientId);
        params.set("target_amount", targetAmountInput.value.trim());
        updateCookLink(params);
    }

    function syncFromInputs(preferredMode) {
        if (preferredMode === "ingredient" || ingredientSelect.value || targetAmountInput.value.trim()) {
            applyIngredientScaling();
            return;
        }

        if (preferredMode === "servings" || servingsInput.value !== String(baseRecipe.original_serves)) {
            applyServingsScaling();
            return;
        }

        renderBaseRecipe();
    }

    servingsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        syncFromInputs("servings");
    });

    ingredientForm.addEventListener("submit", (event) => {
        event.preventDefault();
        syncFromInputs("ingredient");
    });

    servingsInput.addEventListener("input", () => {
        syncFromInputs("servings");
    });

    ingredientSelect.addEventListener("change", () => {
        syncFromInputs("ingredient");
    });

    targetAmountInput.addEventListener("input", () => {
        syncFromInputs("ingredient");
    });

    syncFromInputs();
})();
