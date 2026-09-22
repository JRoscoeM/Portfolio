# Dishbook Recipes

Dishbook is a Django recipe-sharing application. It uses SQLite for local development and
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

Open <http://127.0.0.1:8000>. A deployment health check is available at `/healthz/`.

To recreate the original starter users as well as the seed recipes, run:

```bash
python manage.py shell < setup_starter.py
python manage.py loaddata dishbook/fixtures/seed.json
```

Starter logins are documented in `setup_starter.py`. Their predictable passwords are enabled
only when `DJANGO_DEBUG=true`; the same accounts receive unusable passwords in production.

## Vercel + Neon

Create a Vercel project with this directory (`apps/recipes`) as its root directory. Set:

- `DATABASE_URL` to the pooled Neon PostgreSQL connection string.
- `DJANGO_SECRET_KEY` to a long random secret.
- `DJANGO_DEBUG=false`.
- `DJANGO_ALLOWED_HOSTS` to the production hostname and `.vercel.app`.
- `DJANGO_CSRF_TRUSTED_ORIGINS` to the full HTTPS production origin.

Apply migrations to Neon from a trusted local or CI environment before directing production
traffic to a release:

```bash
DATABASE_URL='postgresql://...' python manage.py migrate --noinput
```

The local `ImageField` backend is suitable only for development. Before adding production
photo uploads, configure an object-storage backend such as Vercel Blob; Vercel function filesystems
are not durable application storage.
