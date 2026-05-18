# Dishbook starter login + seed pack

Put these files into your Django project:

- `dishbook/fixtures/seed.json`
- `setup_starter.py` in the project root (next to `manage.py`)

Then run:

```bash
python manage.py migrate
python manage.py shell < setup_starter.py
python manage.py loaddata dishbook/fixtures/seed.json
```

Known login accounts:

- `alovelace` / `ada`
- `aturing` / `alan`
- `ghopper` / `grace`

Recommended test cases:

- Recipe 1 (`Avocado Toast`) belongs to Ada and is public.
- Recipe 2 (`Tomato Soup`) belongs to Alan and is public.
- Recipe 3 (`Scrambled Eggs`) belongs to Ada and is public.
- Recipe 4 (`Secret Garlic Noodles`) belongs to Alan and is private.

Suggested checks:

- Log in as `alovelace` and confirm you can view Ada's profile.
- Later, when editing is implemented, Ada should be able to edit recipe 1 and 3.
- Alan should be able to edit recipe 2 and 4.
- Logged-out users should not be able to edit anything.
- Non-authors should not be able to edit someone else's private recipe.
