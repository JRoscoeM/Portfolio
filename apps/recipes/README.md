# Group Cookbook

Group Cookbook is a Django recipe-sharing application. It uses SQLite for local development and
Neon PostgreSQL when `DATABASE_URL` is set.

## Local setup

Python 3.12 is recommended.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata dishbook/fixtures/seed.json
python manage.py runserver
```

Open <http://127.0.0.1:8000/recipes/>. A deployment health check is available at `/healthz/`.

To recreate the original starter users as well as the seed recipes, run:

```bash
python manage.py shell < setup_starter.py
python manage.py loaddata dishbook/fixtures/seed.json
```

The starter users only own the seed recipes; they cannot sign in.

## Sign-in

Sign-in is Google only (OAuth authorization-code flow with PKCE, in `dishbook/google_oauth.py`);
there are no passwords, including for the admin. Anyone with a Google account can sign in, and their
first sign-in creates a Django user keyed by Google's stable account id. After that it is an ordinary
Django session, so `request.user` and `@login_required` work as usual.

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: a Google OAuth client (Web application). Register
  `<public origin>/recipes/login/google/callback/` as an authorized redirect URI, e.g.
  `https://www.roscoemoedl.com/recipes/login/google/callback/` and, for local development,
  `http://localhost:8000/recipes/login/google/callback/`. The tracker's client can be reused.
- `COOKBOOK_ADMIN_EMAILS`: comma-separated Google addresses that get the admin. On first sign-in
  such an address takes over an existing user with the same email (for example one made with
  `createsuperuser`).
- `COOKBOOK_PUBLIC_ORIGIN`: where sign-in starts and ends. Defaults to `https://www.roscoemoedl.com`
  when `DJANGO_DEBUG` is false and to the current request's address in development.

The admin at `/recipes/admin/` sends people through the same Google sign-in.

## URLs

All pages live under `/recipes/` (for example `/recipes/recipe/1/`, `/recipes/admin/`). The portfolio
site proxies `www.roscoemoedl.com/recipes/*` to this deployment, so that is the public address; the
same paths also work on `dishbook-recipes.vercel.app`. Old root URLs such as `/recipe/1/` redirect to
their `/recipes/` address. Build links with `{% url %}` and `{% get_static_prefix %}` rather than
hard-coded paths, or they will leave `/recipes/` when viewed through the portfolio.

## Vercel + Neon

Create a Vercel project with this directory (`apps/recipes`) as its root directory. Set:

- `DATABASE_URL` to the pooled Neon PostgreSQL connection string.
- `DJANGO_SECRET_KEY` to a long random secret.
- `DJANGO_DEBUG=false`.
- `DJANGO_ALLOWED_HOSTS` to the production hostname and `.vercel.app`.
- `DJANGO_CSRF_TRUSTED_ORIGINS` to the full HTTPS production origin.
- The sign-in variables above.

Apply migrations to Neon from a trusted local or CI environment before directing production
traffic to a release:

```bash
DATABASE_URL='postgresql://...' python manage.py migrate --noinput
```

The local `ImageField` backend is suitable only for development. Before adding production
photo uploads, configure an object-storage backend such as Vercel Blob; Vercel function filesystems
are not durable application storage.
