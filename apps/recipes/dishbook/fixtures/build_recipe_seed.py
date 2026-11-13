"""Append the personal recipe collection to seed.json.

Run from apps/recipes:  python dishbook/fixtures/build_recipe_seed.py

Steps are written in our own words and each recipe credits its source in the
description. Ingredients are listed as (amount, unit, name); amounts use plain
fractions such as "1 1/2" so recipe scaling can parse them, and items without
a fixed quantity leave the amount blank.

The script is idempotent: it drops any records it added before (by title or
tag name) and re-adds them after the existing seed data.
"""

import json
from pathlib import Path

SEED = Path(__file__).with_name("seed.json")

NEW_TAGS = [
    "dinner", "dessert", "baking", "soup", "side", "sandwich",
    "slow cooker", "drinks", "make ahead", "high protein",
]

# (title, description, prep, cook, serves, author, tags, steps)
# steps: [(text, [(amount, unit, name), ...]), ...]
RECIPES = [
    (
        "Twice-Cooked Baked Beans",
        "Sweet, smoky, and a little spicy baked beans finished low and slow in the oven. "
        "Adapted from Alton Brown's \"The Once and Future Beans\" (Good Eats).",
        30, 480, 10, 1, ["side", "comfort", "make ahead"],
        [
            ("Cover the beans with cold water in a large container and soak overnight.",
             [("1", "lb", "dried Great Northern beans")]),
            ("Heat the oven to 250°F.", []),
            ("In a 6-quart Dutch oven over medium heat, cook the bacon with the onion and jalapeños "
             "until the fat renders and the onion softens, about 5 minutes. Stir in the tomato paste, "
             "brown sugar, and molasses.",
             [("1", "lb", "bacon, chopped"), ("1", "", "onion, chopped"),
              ("2", "", "jalapeños, seeded and chopped"), ("1/4", "cup", "tomato paste"),
              ("1/4", "cup", "dark brown sugar"), ("1/3", "cup", "molasses")]),
            ("Drain the beans, saving 2 cups of the soaking water. Add the beans, saved water, and stock "
             "to the pot and bring to a boil over high heat. Season with the liquid smoke, cayenne, "
             "pepper, salt, and urfa biber, stir, cover, and bake until the beans are tender, 6 to 8 hours.",
             [("2", "cups", "chicken stock"), ("1/2", "tsp", "liquid smoke"),
              ("1/2", "tsp", "cayenne pepper"), ("1", "tsp", "black pepper"),
              ("2", "tsp", "kosher salt"), ("1", "tsp", "urfa biber (optional)")]),
        ],
    ),
    (
        "Creamy Chicken and Potato Soup",
        "A cozy weeknight soup built on Better Than Bouillon, with an optional splash of cream.",
        10, 35, 4, 2, ["soup", "dinner", "comfort"],
        [
            ("Heat the butter or oil in a large pot over medium heat. Cook the onion, carrots, and celery "
             "until soft, 5 to 7 minutes, then add the garlic for 30 seconds.",
             [("2", "tbsp", "butter or olive oil"), ("1", "small", "onion, diced"),
              ("2", "", "carrots, sliced"), ("2", "stalks", "celery, chopped"),
              ("3", "cloves", "garlic, minced")]),
            ("Add the chicken and cook until lightly browned, 4 to 5 minutes. It doesn't need to be cooked through.",
             [("1", "lb", "chicken breast, cut into bite-sized pieces")]),
            ("Add the water, bouillon, potatoes, thyme, and bay leaf. Bring to a boil, then simmer until "
             "the potatoes are tender and the chicken is cooked, 20 to 25 minutes.",
             [("5", "cups", "water"), ("2", "tsp", "Better Than Bouillon chicken base"),
              ("2", "medium", "potatoes, peeled and diced"), ("1", "tsp", "dried thyme"),
              ("1", "", "bay leaf")]),
            ("For a creamier soup, mash some of the potatoes in the pot, stir in the milk or cream, and simmer 5 more minutes.",
             [("1/2", "cup", "milk or cream (optional)")]),
            ("Season with salt and pepper (go easy on the salt, the bouillon is salty), remove the bay leaf, and garnish.",
             [("", "", "salt and black pepper, to taste"), ("", "", "parsley or green onion, for garnish")]),
        ],
    ),
    (
        "Ginger Soy Braised Chicken with Buttered Lo Mein",
        "A forgiving, crowd-sized braise that holds well and tastes like more work than it is. "
        "Sized for about 7 people.",
        20, 50, 7, 3, ["dinner", "comfort"],
        [
            ("Season the chicken thighs and brown them in batches in a large pot. Set aside.",
             [("5", "lb", "chicken thighs"), ("", "", "salt and black pepper")]),
            ("In the same pot, cook the onions, carrots, and mushrooms until softened, then add the garlic and ginger for a minute.",
             [("3", "", "onions, sliced"), ("", "", "carrots, sliced"), ("", "", "mushrooms, sliced"),
              ("", "", "garlic, minced (plenty)"), ("", "", "fresh ginger, minced (plenty)")]),
            ("Deglaze with the wine, then add the stock, soy sauce, honey, and red pepper flakes.",
             [("1/2", "cup", "wine"), ("2", "qt", "beef stock"), ("1/2", "cup", "soy sauce"),
              ("1/4", "cup", "honey"), ("", "pinch", "red pepper flakes")]),
            ("Return the chicken and braise until it is tender and just starting to fall apart, 30 to 40 minutes.", []),
            ("Boil the lo mein, then toss with butter, a splash of soy sauce, black pepper, and green onions. "
             "Serve the chicken over the noodles with plenty of braising liquid.",
             [("2", "lb", "lo mein noodles"), ("", "", "butter"), ("", "", "green onions, sliced")]),
        ],
    ),
    (
        "Chewy Chocolate Chip Cookies (Alton Brown)",
        "Bread flour, melted butter, and extra brown sugar make these extra chewy. "
        "Adapted from Alton Brown's \"The Chewy\" (Good Eats). Make a full batch and freeze extra dough.",
        20, 30, 24, 1, ["dessert", "baking"],
        [
            ("Heat the oven to 375°F with racks in the top and bottom thirds. Line 4 half-sheet pans with parchment.", []),
            ("Melt the butter over low heat and let it cool slightly.",
             [("16", "tbsp", "unsalted butter")]),
            ("Sift the flour, salt, and baking soda together.",
             [("12", "oz", "bread flour"), ("1", "tsp", "kosher salt"), ("1", "tsp", "baking soda")]),
            ("Beat the butter and both sugars in a stand mixer with the paddle on medium for 2 minutes.",
             [("2", "oz", "granulated sugar"), ("8", "oz", "light brown sugar")]),
            ("Whisk the egg, yolk, milk, and vanilla in a separate bowl, then mix into the butter on low until combined, about 30 seconds.",
             [("1", "large", "egg"), ("1", "large", "egg yolk"), ("2", "tbsp", "whole milk"),
              ("1 1/2", "tsp", "vanilla extract")]),
            ("Add the dry ingredients gradually, scraping the bowl, then mix in the chocolate. Chill the dough for 1 hour.",
             [("12", "oz", "semisweet chocolate chips (or chopped ~68% dark chocolate)")]),
            ("Scoop 1 1/2-ounce portions, 6 per pan. Bake two pans at a time for 15 minutes, rotating halfway.", []),
            ("Slide the parchment onto a rack and let the cookies cool at least 5 minutes.", []),
        ],
    ),
    (
        "Chocolate Chip Cookies (Jacques Torres)",
        "Big, bakery-style cookies with a long rest that hydrates the dough. Plan ahead: the dough chills 24 to 36 hours. "
        "Adapted from the New York Times recipe by Jacques Torres and David Leite.",
        45, 20, 18, 2, ["dessert", "baking", "make ahead"],
        [
            ("Sift both flours, the baking soda, baking powder, and salt into a bowl.",
             [("8 1/2", "oz", "cake flour"), ("8 1/2", "oz", "bread flour"),
              ("1 1/4", "tsp", "baking soda"), ("1 1/2", "tsp", "baking powder"),
              ("1 1/2", "tsp", "coarse sea salt, plus more for sprinkling")]),
            ("Cream the butter and sugars with the paddle until very light, about 5 minutes. Beat in the eggs one at a time, then the vanilla.",
             [("1 1/4", "cups", "unsalted butter"), ("10", "oz", "light brown sugar"),
              ("8", "oz", "granulated sugar"), ("2", "large", "eggs"),
              ("2", "tsp", "vanilla extract")]),
            ("On low speed, mix in the dry ingredients just until combined, 5 to 10 seconds. Gently mix in the chocolate. "
             "Press plastic wrap onto the dough and refrigerate 24 to 36 hours (up to 72).",
             [("1 1/4", "lb", "bittersweet chocolate disks, 60% cacao or higher")]),
            ("Heat the oven to 350°F and line a baking sheet with parchment.", []),
            ("Scoop six 3 1/2-ounce mounds per sheet, laying any upright chocolate pieces flat. Sprinkle with sea salt and bake "
             "until golden but still soft, 18 to 20 minutes. Cool on the sheet 10 minutes, then on a rack.", []),
        ],
    ),
    (
        "Chewy Chocolate Chip Cookies (Sally's Baking)",
        "Melted butter and a little cornstarch give soft, thick cookies. Chill the dough at least 2 hours. "
        "Adapted from Sally's Baking Addiction.",
        15, 13, 16, 3, ["dessert", "baking"],
        [
            ("Whisk the flour, baking soda, cornstarch, and salt together.",
             [("2 1/4", "cups", "all-purpose flour"), ("1", "tsp", "baking soda"),
              ("1 1/2", "tsp", "cornstarch"), ("1/2", "tsp", "salt")]),
            ("Whisk the melted butter with both sugars until smooth, then whisk in the egg, yolk, and vanilla.",
             [("3/4", "cup", "unsalted butter, melted and cooled 5 minutes"),
              ("3/4", "cup", "packed brown sugar"), ("1/2", "cup", "granulated sugar"),
              ("1", "large", "egg, room temperature"), ("1", "", "egg yolk, room temperature"),
              ("2", "tsp", "vanilla extract")]),
            ("Stir the wet mixture into the dry to make a soft, thick dough, then fold in the chocolate.",
             [("1 1/4", "cups", "semi-sweet chocolate chips or chunks")]),
            ("Cover and chill at least 2 hours, ideally overnight (up to 3 days).", []),
            ("Heat the oven to 325°F and line baking sheets. If the dough chilled a long time, let it sit out 15 minutes.", []),
            ("Scoop about 2 oz of dough per cookie, shape each ball taller than it is wide, and space them 3 inches apart.", []),
            ("Bake 13 to 14 minutes, until the edges are just barely brown. Cool on the sheet 10 minutes, then on a rack.", []),
        ],
    ),
    (
        "Brown Butter Chocolate Chip Cookies (Food Lab)",
        "Brown butter, whipped eggs, and chopped chocolate for toffee-like depth. Chill the dough overnight. "
        "Adapted from J. Kenji López-Alt at Serious Eats.",
        20, 30, 28, 1, ["dessert", "baking", "make ahead"],
        [
            ("Brown the butter in a saucepan over medium-high heat, swirling, until nutty, about 5 minutes. Move it to a bowl, "
             "whisk in the ice cube, and refrigerate about 20 minutes until cool, whisking now and then.",
             [("8", "oz", "unsalted butter"), ("1", "", "ice cube")]),
            ("Whisk the flour, baking soda, and salt together.",
             [("10", "oz", "all-purpose flour"), ("3/4", "tsp", "baking soda"),
              ("2", "tsp", "Diamond Crystal kosher salt")]),
            ("In a stand mixer with the whisk, beat the granulated sugar, eggs, and vanilla on medium-high until pale and ribbony, about 5 minutes.",
             [("5", "oz", "granulated sugar"), ("2", "large", "eggs"), ("2", "tsp", "vanilla extract")]),
            ("Switch to the paddle. Mix in the brown sugar and cooled butter (15 seconds), then the flour on low until barely combined, "
             "then the chocolate. Refrigerate airtight overnight, up to 3 days.",
             [("5", "oz", "dark brown sugar"), ("8", "oz", "semisweet chocolate, chopped")]),
            ("Heat the oven to 325°F with racks in the upper and lower middle. Scoop 3-tablespoon balls, 6 to 8 per sheet; tear each "
             "in half and press back together rough side out. Bake 13 to 16 minutes, rotating halfway, until golden at the edges but soft.", []),
            ("Sprinkle the hot cookies lightly with flaky salt, rest 2 minutes, then cool on a rack.",
             [("", "", "coarse sea salt, for garnish")]),
        ],
    ),
    (
        "Lean Beef and Potato Stew",
        "A high-protein stew using lean bottom round and bone broth. About 410 calories and 48 g protein per serving.",
        15, 105, 4, 2, ["soup", "dinner", "high protein"],
        [
            ("Season the beef with salt and pepper. Sear in the oil in a Dutch oven over medium-high heat, in one layer, "
             "2 to 3 minutes per side until deeply browned. Set aside.",
             [("1 1/2", "lb", "lean beef bottom round, 1-inch cubes"), ("1", "tbsp", "olive oil"),
              ("", "", "salt and black pepper")]),
            ("Lower the heat to medium. Cook the onion, carrots, and celery about 5 minutes, scraping up the browned bits, "
             "then stir in the garlic and tomato paste for 1 minute.",
             [("1", "medium", "yellow onion, diced"), ("3", "large", "carrots, cut into thick coins"),
              ("2", "stalks", "celery, chopped"), ("3", "cloves", "garlic, minced"),
              ("2", "tbsp", "tomato paste")]),
            ("Add the broth, herbs, and the beef with its juices. Bring to a gentle boil, cover, and simmer on low for 1 hour.",
             [("4", "cups", "beef bone broth"), ("1", "tsp", "dried thyme"), ("1", "tsp", "dried rosemary")]),
            ("Stir in the potatoes, cover, and simmer 30 to 45 minutes until everything is tender. "
             "Uncover for the last 10 minutes if you want it thicker.",
             [("1", "lb", "baby Yukon Gold potatoes, quartered")]),
        ],
    ),
    (
        "French Dip Sandwiches",
        "Slow-roasted rib roast, deeply caramelized onions, a red wine jus, and horseradish mayo. "
        "Roast the beef a day ahead. Adapted from Joshua Weissman.",
        120, 240, 4, 3, ["dinner", "sandwich", "make ahead"],
        [
            ("Brush the roast with Dijon and season generously. Roast on a rack at 250°F until it reads 115°F inside, about 2 to 2 1/2 hours.",
             [("3 1/2", "lb", "boneless rib roast"), ("1", "tbsp", "Dijon mustard"),
              ("", "", "kosher salt and black pepper")]),
            ("Rest 30 minutes while the oven heats as hot as it goes. Pat dry and return to the oven 3 to 5 minutes to brown. "
             "Cool, wrap, and refrigerate overnight, then slice as thinly as possible.", []),
            ("For the onions, melt the butter with the oil in a large pot over medium heat. Add the onions and salt, cover, and cook "
             "until they release their liquid, 15 to 20 minutes. Uncover, lower to medium-low, and cook until deeply caramelized, 1 to 1 1/2 hours.",
             [("2", "tbsp", "unsalted butter"), ("2", "tbsp", "extra-virgin olive oil"),
              ("7", "large", "yellow onions, thinly sliced")]),
            ("For the jus, melt the butter and soften the celery, carrots, onion, and garlic with a pinch of salt, 2 to 3 minutes. "
             "Toast the peppercorns 30 seconds, then cook the tomato paste until it darkens.",
             [("3", "tbsp", "unsalted butter"), ("2", "ribs", "celery, diced"),
              ("2", "large", "carrots, diced"), ("1", "large", "yellow onion, chopped"),
              ("5", "cloves", "garlic, smashed"), ("1", "tbsp", "black peppercorns"),
              ("1/4", "cup", "tomato paste")]),
            ("Add the wine and reduce by half. Add the stock, thyme, and bay leaves and simmer 15 minutes. Strain, then season with salt, "
             "Worcestershire, and shirodashi or MSG if you like.",
             [("2", "cups", "dry red wine"), ("2", "qt", "beef stock"), ("1/2", "bunch", "fresh thyme"),
              ("2", "", "bay leaves"), ("1", "tbsp", "Worcestershire sauce"),
              ("", "", "shirodashi and MSG (optional)")]),
            ("For the mayo, put the yolks, Dijon, salt, lemon zest and juice, water, oil, and garlic in a tall container. Blend with an "
             "immersion blender from the bottom, slowly lifting as it thickens. Fold in the horseradish, pepper, and herbs; chill.",
             [("4", "", "egg yolks"), ("2", "tbsp", "Dijon mustard"), ("1", "tsp", "lemon zest"),
              ("1 1/2", "tbsp", "lemon juice"), ("1", "tbsp", "water"), ("1 1/2", "cups", "neutral oil"),
              ("3", "cloves", "garlic, grated"), ("2", "tbsp", "fresh horseradish, grated"),
              ("2", "tbsp", "chives, thinly sliced"), ("2", "tbsp", "parsley, chopped")]),
            ("Cut the baguettes into 6- to 8-inch pieces, split, toast in butter, and spread with mayo. Warm the beef briefly in "
             "simmering jus, pile it on, top with onions and provolone, and broil until melted. Serve with jus for dipping.",
             [("2", "", "baguettes"), ("", "", "unsalted butter, for toasting"),
              ("1/2", "lb", "sharp provolone, thinly sliced")]),
        ],
    ),
    (
        "Hario Switch Hybrid Brew",
        "Immersion then drawdown in a Hario Switch for a cup with body and clarity, in the style of James Hoffmann's method.",
        2, 4, 1, 1, ["drinks", "quick"],
        [
            ("Rinse a paper filter in the Switch with hot water to preheat it, and discard the water.",
             [("1", "", "V60-02 paper filter")]),
            ("Add the coffee, ground medium-fine (about like V60).",
             [("15", "g", "coffee")]),
            ("Pour about 60 ml of 93 to 95°C water to wet all the grounds and let it bloom 30 to 45 seconds.",
             [("300", "ml", "water, 93 to 95°C")]),
            ("Pour in the rest of the water and stir gently. Let it steep until about the 2-minute mark.", []),
            ("Open the switch and let it drain; total time is about 3:30 to 4:15. Adjust grind and steep time to taste.", []),
        ],
    ),
    (
        "Crispy Roast Potatoes",
        "Parboiled in alkaline water and roughed up so they roast up glass-crisp with fluffy centers. "
        "Adapted from J. Kenji López-Alt at Serious Eats.",
        10, 75, 6, 2, ["side", "comfort"],
        [
            ("Heat the oven to 450°F (400°F convection) with a rack in the center.", []),
            ("Bring the water to a boil with the salt and baking soda. Add the potatoes and simmer until a knife slides in with "
             "little resistance, about 10 minutes.",
             [("2", "qt", "water"), ("2", "tbsp", "kosher salt"), ("1/2", "tsp", "baking soda"),
              ("4", "lb", "russet or Yukon Gold potatoes, peeled, in 2- to 3-inch chunks")]),
            ("Meanwhile, heat the fat with the rosemary, garlic, and pepper over medium, stirring, until the garlic just turns golden, "
             "about 3 minutes. Strain the fat into a large bowl and keep the solids.",
             [("5", "tbsp", "olive oil, duck fat, or beef fat"),
              ("", "", "small handful fresh rosemary, chopped"), ("3", "cloves", "garlic, minced"),
              ("", "", "black pepper")]),
            ("Drain the potatoes, let them steam dry 30 seconds, then toss them hard in the fat with a little salt until coated in a starchy paste.", []),
            ("Spread on a rimmed baking sheet. Roast 20 minutes untouched, loosen and flip, then roast 30 to 40 minutes more, turning a few times, until deep brown.", []),
            ("Toss with the reserved garlic and rosemary and the parsley, season, and serve right away.",
             [("", "", "small handful fresh parsley, minced")]),
        ],
    ),
    (
        "All-American Beef Stew",
        "Chuck roast stew with a gelatin-rich, umami-boosted broth. Adapted from J. Kenji López-Alt at Serious Eats.",
        15, 190, 6, 3, ["soup", "dinner", "comfort"],
        [
            ("Blend the stock, tomato paste, anchovies, gelatin, soy sauce, and Worcestershire until smooth.",
             [("4", "cups", "low-sodium chicken stock"), ("3", "tbsp", "tomato paste"),
              ("3", "", "anchovy fillets (or 1 tbsp fish sauce)"),
              ("4", "packets", "unflavored gelatin"), ("1", "tbsp", "soy sauce"),
              ("1", "tbsp", "Worcestershire sauce")]),
            ("Heat the oven to 300°F with a rack low. Heat the oil in a Dutch oven over medium-high, season the beef, and brown it well on two sides, about 10 minutes. Set aside.",
             [("2", "tbsp", "vegetable oil"), ("3", "lb", "boneless beef chuck roast, cut into 3 steaks"),
              ("", "", "kosher salt and black pepper")]),
            ("Brown the mushrooms, about 6 minutes, then the diced carrots and pearl onions. Season and set aside.",
             [("10", "oz", "button mushrooms, quartered"), ("2", "medium", "carrots, bite-sized"),
              ("8", "oz", "pearl onions")]),
            ("Brown the halved onion cut side down with the whole carrots, celery, and garlic, about 4 minutes.",
             [("1", "large", "yellow onion, unpeeled, halved"), ("2", "medium", "carrots, whole"),
              ("2", "small", "ribs celery"), ("3", "cloves", "garlic, unpeeled")]),
            ("Add the wine, scrape up the browned bits, and reduce by three quarters. Add the stock mixture, bring to a simmer, and take off the heat.",
             [("1", "cup", "sherry, dry vermouth, or red wine")]),
            ("Cut the beef into 1 1/2- to 2-inch chunks, toss with flour, and add to the pot with the herbs. Return to a simmer, then cook "
             "in the oven partly covered until the beef starts to get tender, about 1 1/2 hours.",
             [("2", "tbsp", "all-purpose flour"), ("2", "", "bay leaves"), ("4", "sprigs", "thyme")]),
            ("Remove the whole vegetables and herbs. Add the potatoes and the reserved mushrooms, carrots, and pearl onions, and cook "
             "45 minutes to 1 hour more until everything is tender.",
             [("1", "lb", "Yukon Gold potatoes, peeled and cubed")]),
            ("Simmer on the stove to thicken if needed, stir in the peas, and season.",
             [("4", "oz", "frozen peas")]),
        ],
    ),
    (
        "Loaded Budget Burritos",
        "Homemade tortillas, cilantro-lime rice, chipotle chicken, bacon black beans, charred peppers, and a smoky aioli. "
        "Adapted from Joshua Weissman.",
        120, 60, 6, 1, ["dinner", "make ahead"],
        [
            ("For the tortillas, whisk the flour, baking powder, and salt. Add the warm water and oil and mix into a shaggy dough. "
             "Knead 2 to 3 minutes until smooth, cover, and rest 30 to 60 minutes.",
             [("2", "cups", "all-purpose flour"), ("1/2", "tsp", "baking powder"),
              ("1", "tsp", "fine sea salt"), ("3/4", "cup", "warm water"), ("1/4", "cup", "vegetable oil")]),
            ("Divide into 6 to 8 balls and roll each thin. Cook in a very hot cast-iron pan about 30 seconds until puffed and charred "
             "in spots, flip for 20 to 30 seconds, and keep wrapped and warm.", []),
            ("For the rice, rinse it 2 to 3 times, cook it with the water in a rice cooker, then stir in the butter, salt, cilantro, and lime juice.",
             [("1", "cup", "medium-grain rice"), ("1", "cup", "water"), ("2", "tbsp", "unsalted butter"),
              ("1/4", "cup", "cilantro, chopped"), ("1", "", "lime, juiced")]),
            ("For the chicken, heat the oven to 400°F. Toss the thighs with the salt, spices, and adobo liquid.",
             [("2", "lb", "boneless skinless chicken thighs"), ("2", "tbsp", "kosher salt"),
              ("1", "tsp", "onion powder"), ("1", "tbsp", "garlic powder"), ("2", "tsp", "ground cumin"),
              ("1", "tbsp", "smoked paprika"), ("1", "tsp", "black pepper"),
              ("", "", "liquid from 1/2 can chipotles in adobo")]),
            ("Sear in batches in very hot oil until charred, then bake on a sheet pan 10 to 15 minutes to 165°F. Chop and toss in the pan juices.",
             [("2", "tbsp", "vegetable oil")]),
            ("For the beans, soften the onion and jalapeños in the butter with salt and pepper, then add the beans and hot sauce and heat "
             "through. Crisp the bacon from a cold pan, chop it into the beans, and save the fat.",
             [("2", "tbsp", "unsalted butter"), ("1", "", "sweet onion, thinly sliced"),
              ("2", "", "jalapeños, thinly sliced"), ("15", "oz", "black beans, drained"),
              ("2", "tbsp", "hot sauce"), ("3", "slices", "bacon")]),
            ("For the veggies, heat the bacon fat until very hot and char the pepper, onion, and jalapeños with salt, 3 to 5 minutes. "
             "Off the heat, stir in the garlic.",
             [("1", "", "red bell pepper, sliced"), ("1", "", "sweet onion, sliced"),
              ("2", "", "jalapeños, sliced"), ("2", "cloves", "garlic, chopped")]),
            ("Whisk the aioli ingredients together with salt to taste.",
             [("1", "cup", "mayonnaise"), ("1", "tbsp", "smoked paprika"), ("2", "tbsp", "hot sauce"),
              ("2", "tbsp", "lime juice"), ("3", "cloves", "garlic, grated")]),
            ("Fill each tortilla with rice, beans, chicken, aioli, veggies, cilantro, and cheddar. Fold in the sides, roll tightly, and rest seam side down.",
             [("", "", "cilantro leaves"), ("", "", "cheddar cheese, grated")]),
        ],
    ),
    (
        "Buttermilk Bran Muffins",
        "Moist one-bowl bran muffins with raisins and a honey-butter glaze. Adapted from The Café Sucre Farine.",
        20, 15, 16, 2, ["breakfast", "baking"],
        [
            ("Heat the oven to 400°F and grease 16 regular muffin cups (or 12 for larger muffins).", []),
            ("Whisk the oil, brown sugar, and eggs, then stir in the molasses, buttermilk, and vanilla.",
             [("1/2", "cup", "mild-flavored oil"), ("1/2", "cup", "brown sugar"), ("3", "", "eggs"),
              ("1/4", "cup", "molasses"), ("1 1/2", "cups", "buttermilk"), ("1", "tsp", "vanilla extract")]),
            ("Sprinkle the bran, flours, baking powder, baking soda, and salt over the top and stir just until combined. Stir in the raisins.",
             [("2", "cups", "wheat bran"), ("1", "cup", "whole wheat flour"), ("2/3", "cup", "all-purpose flour"),
              ("1", "tsp", "baking powder"), ("1", "tsp", "baking soda"), ("1/2", "tsp", "salt"),
              ("2/3", "cup", "raisins")]),
            ("Fill the cups almost to the top and bake 12 to 15 minutes, until firm and a tester comes out clean. Cool in the pan 5 minutes.", []),
            ("Stir the melted butter and honey together and brush over the warm muffins.",
             [("1", "tbsp", "honey"), ("1", "tbsp", "butter, melted")]),
        ],
    ),
    (
        "Smoked Pulled Pork",
        "Dry-brined pork shoulder smoked low and slow until it shreds, with plenty of bark. "
        "Adapted from Daniel Gritzer at Serious Eats.",
        10, 720, 8, 3, ["dinner", "make ahead"],
        [
            ("The day before, salt the pork all over and refrigerate it on a rack over a baking sheet for 8 to 24 hours.",
             [("10", "lb", "bone-in pork butt (or 6 lb boneless, tied)"), ("", "", "kosher salt")]),
            ("Slather the exposed sides with mustard (and hot sauce if you like) and coat with dry rub. Flip fat side up and repeat.",
             [("", "", "yellow or brown mustard"), ("", "", "hot sauce (optional)"),
              ("", "", "pulled pork dry rub")]),
            ("Bring the smoker to a steady 225°F with clean, thin smoke. Add the pork fat side up, with a pan of water in the smoker.", []),
            ("Smoke until a probe in the center (not touching bone) reads 195°F, usually 12 to 15 hours. Rest 20 minutes.", []),
            ("Shred the pork, discarding bones or twine, and mix in the chopped bark and fat.", []),
            ("Season with vinegar barbecue sauce and salt, and serve on potato buns with coleslaw.",
             [("", "", "Eastern North Carolina vinegar barbecue sauce"), ("", "", "potato buns"),
              ("", "", "coleslaw")]),
        ],
    ),
    (
        "Shakshuka with Urfa Biber Harissa",
        "Eggs baked in a smoky pepper and tomato stew with homemade harissa and preserved lemon. "
        "Adapted from Alton Brown (Good Eats). Start the preserved lemons a month ahead, or use store-bought.",
        25, 55, 6, 1, ["breakfast", "vegetarian"],
        [
            ("For the harissa, toast the cumin, coriander, and caraway in a dry skillet about 3 minutes. Add the oil, garlic, onion, and salt and cook until the garlic browns.",
             [("2", "tbsp", "cumin seed"), ("1", "tbsp", "coriander seed"), ("1", "tsp", "caraway seeds"),
              ("1/4", "cup", "extra-virgin olive oil"), ("8", "large", "garlic cloves, sliced"),
              ("1", "medium", "onion, diced"), ("1", "tbsp", "kosher salt")]),
            ("Stir in the urfa biber and tomato paste for 1 minute, add the vinegar for 2 minutes, then purée. Makes about 2 cups and keeps 3 months refrigerated.",
             [("1", "cup", "urfa biber"), ("3", "tbsp", "tomato paste"), ("1/4", "cup", "red wine vinegar")]),
            ("For the preserved lemons, cut the lemons into wedges and pack them into a pint jar in layers with the salt, pressing out the juice. "
             "Top with juice, refrigerate 4 days, flip the jar, and wait 4 more days. They're best after a month.",
             [("4", "", "lemons, plus juice of 1 more if needed"), ("40", "g", "kosher salt")]),
            ("Broil the halved, seeded peppers cut side down until charred, about 10 minutes. Cover in a bowl for 15 minutes, peel, and chop.",
             [("2", "", "red bell peppers")]),
            ("Heat the oil in a 10-inch cast-iron skillet over medium. Add the garlic and salt and cook until the garlic starts to brown, about 1 minute.",
             [("1/4", "cup", "extra-virgin olive oil"), ("3", "large", "garlic cloves, thinly sliced"),
              ("1 1/2", "tsp", "kosher salt")]),
            ("Stir in the harissa, brown sugar, and preserved lemon for 30 seconds. Add the peppers, grate in the tomatoes (discard the skins), and simmer on medium-low 20 minutes.",
             [("3", "tbsp", "urfa biber harissa (from above)"), ("1", "tbsp", "dark brown sugar"),
              ("2", "tsp", "preserved lemon, mashed"), ("2", "lb", "beefsteak tomatoes, halved and seeded")]),
            ("Boil the eggs in their shells for 1 minute, then chill in ice water for 30 seconds.",
             [("6", "large", "eggs")]),
            ("Make 6 wells in the sauce and crack in the eggs. Cook on medium-low until the whites set but the yolks are runny, about 12 minutes. Garnish with parsley.",
             [("", "", "flat-leaf parsley, chopped")]),
        ],
    ),
    (
        "Slow Cooker Pulled Pork",
        "A set-it-and-forget-it pulled pork with a simple paprika rub and orange juice. Adapted from Downshiftology.",
        5, 480, 8, 2, ["dinner", "slow cooker"],
        [
            ("Mix the spices and rub them all over the pork.",
             [("4 1/2", "lb", "pork shoulder"), ("2", "tbsp", "paprika"), ("1", "tsp", "dried oregano"),
              ("1", "tsp", "salt"), ("1", "tsp", "black pepper"), ("1/2", "tsp", "ground cumin")]),
            ("Put the pork in the slow cooker and top with the onion, garlic, and orange juice.",
             [("1", "", "yellow onion, diced"), ("4", "cloves", "garlic, chopped"), ("1", "", "orange, juiced")]),
            ("Cover and cook on low for 8 hours. Shred and return the meat to the juices.", []),
        ],
    ),
    (
        "Vinegar Coleslaw",
        "A tangy, mayo-free slaw with a toasted-spice dressing. Great with pulled pork. Adapted from Alton Brown.",
        30, 0, 8, 3, ["side", "vegetarian", "make ahead"],
        [
            ("Warm the oil with the celery seed, cumin, and pepper flakes over medium-low until fragrant, about 2 minutes. Cool 10 minutes.",
             [("1/4", "cup", "light olive oil"), ("1", "tsp", "whole celery seed"),
              ("1/2", "tsp", "whole cumin seed, lightly crushed"), ("1/2", "tsp", "red pepper flakes")]),
            ("Shake the spiced oil in a jar with the vinegars, sugar, Dijon, salt, and pepper. Let stand 1 hour.",
             [("1/4", "cup", "apple cider vinegar"), ("1/4", "cup", "rice wine vinegar"),
              ("3", "tbsp", "granulated sugar"), ("1", "tsp", "Dijon mustard"),
              ("1", "tsp", "Diamond Crystal kosher salt"), ("1/4", "tsp", "black pepper")]),
            ("Finely shred the cabbage, grate the carrots, and thinly slice the onion into a salad spinner. Toss with the sugar and salt "
             "and let sit 10 to 15 minutes until the vegetables soften.",
             [("3", "lb", "cabbage"), ("3", "medium", "carrots"), ("1", "", "yellow onion"),
              ("1/2", "cup", "granulated sugar"), ("1/3", "cup", "Diamond Crystal kosher salt")]),
            ("Toss the vegetables with the dressing and refrigerate at least 2 hours before serving.", []),
        ],
    ),
    (
        "Whole Wheat Buttermilk Pancakes",
        "Light whole wheat pancakes that freeze well. Adapted from 100 Days of Real Food.",
        10, 15, 2, 1, ["breakfast", "vegetarian", "quick"],
        [
            ("Whisk the flour, baking powder, baking soda, and salt in a large bowl.",
             [("7/8", "cup", "whole-wheat pastry flour"), ("1/2", "tsp", "baking powder"),
              ("1/2", "tsp", "baking soda"), ("1/4", "tsp", "salt")]),
            ("Make a well in the center, add the buttermilk, egg, honey, and vanilla, and stir until combined.",
             [("1", "cup", "buttermilk"), ("1", "", "egg"), ("1/2", "tbsp", "honey"),
              ("1/2", "tsp", "vanilla extract")]),
            ("Heat a griddle over medium-high, coat it with butter, and ladle in the batter.",
             [("", "", "butter, for cooking")]),
            ("Flip when the bottoms are golden and the tops are bubbly, then cook the other side. Serve with maple syrup and fruit; freeze leftovers.", []),
        ],
    ),
]


def main():
    data = json.loads(SEED.read_text())
    titles = {r[0] for r in RECIPES}

    # Drop anything a previous run added so the script can be re-run safely.
    old_recipes = {x["pk"] for x in data if x["model"] == "dishbook.recipe" and x["fields"]["title"] in titles}
    old_steps = {x["pk"] for x in data if x["model"] == "dishbook.step" and x["fields"]["recipe"] in old_recipes}
    data = [
        x for x in data
        if not (x["model"] == "dishbook.recipe" and x["pk"] in old_recipes)
        and not (x["model"] == "dishbook.step" and x["pk"] in old_steps)
        and not (x["model"] == "dishbook.ingredient" and x["fields"]["step"] in old_steps)
        and not (x["model"] == "dishbook.tag" and x["fields"]["name"] in NEW_TAGS)
    ]

    def next_pk(model):
        return max((x["pk"] for x in data if x["model"] == model), default=0) + 1

    tag_ids = {x["fields"]["name"]: x["pk"] for x in data if x["model"] == "dishbook.tag"}
    pk = next_pk("dishbook.tag")
    for name in NEW_TAGS:
        tag_ids[name] = pk
        data.append({"model": "dishbook.tag", "pk": pk, "fields": {"name": name}})
        pk += 1

    recipe_pk, step_pk, ing_pk = next_pk("dishbook.recipe"), next_pk("dishbook.step"), next_pk("dishbook.ingredient")
    recipes, steps, ingredients = [], [], []
    for title, desc, prep, cook, serves, author, tags, recipe_steps in RECIPES:
        assert len(title) <= 200
        recipes.append({"model": "dishbook.recipe", "pk": recipe_pk, "fields": {
            "title": title, "description": desc, "prep_time_minutes": prep,
            "cook_time_minutes": cook, "serves": serves, "author": author, "photo": "",
            "is_public": True, "tags": [tag_ids[t] for t in tags],
        }})
        for order, (text, items) in enumerate(recipe_steps, start=1):
            steps.append({"model": "dishbook.step", "pk": step_pk, "fields": {
                "recipe": recipe_pk, "order": order, "description": text}})
            for amount, unit, name in items:
                assert len(amount) <= 40 and len(unit) <= 40 and len(name) <= 100, name
                ingredients.append({"model": "dishbook.ingredient", "pk": ing_pk, "fields": {
                    "step": step_pk, "amount": amount, "unit": unit, "name": name}})
                ing_pk += 1
            step_pk += 1
        recipe_pk += 1

    # Existing records keep their order; new ones go at the end, parents before children.
    out = data + recipes + steps + ingredients
    SEED.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(recipes)} recipes, {len(steps)} steps, {len(ingredients)} ingredients, {len(NEW_TAGS)} tags added")


if __name__ == "__main__":
    main()
