# Tracker Backend

This is the server side of the habit and workout tracker (Daily Log). Anyone can sign in with Google or GitHub and gets a private account; a frontend-only guest demo needs no sign-in.

## Accounts and privacy boundary

- Sign-in is OAuth (Google and/or GitHub, authorization-code flow with PKCE and a `state` cookie). Sign-up is open: the first sign-in from an account creates a `tracker_users` row and its starter exercise catalog.
- A user's id is `<provider>:<provider account id>` (for example `google:1234567890`), built from the provider's stable account id rather than an email or login. The same person signing in with Google and with GitHub gets two separate accounts.
- The account named in `TRACKER_OWNER_GOOGLE_EMAIL` or `TRACKER_OWNER_GITHUB_ID` maps to the original `owner` row instead, so the data from before sign-up was opened stays with its owner. Both variables are optional.
- A successful sign-in receives a signed, seven-day, `HttpOnly`, `SameSite=Strict` cookie carrying the user id. Provider access tokens are used once to read the account identity and are never stored.
- Every Neon query is scoped to the user id from the session cookie. The API never accepts a browser-supplied user id, and all data routes return `401` without a valid session.
- Guest mode must use local/demo data in the browser and must not call any `/api/tracker/*` data route.
- Missing `DATABASE_URL` or `TRACKER_SESSION_SECRET` fails closed with `503`. A provider without both its client id and secret is simply not offered.
- There is no rate limiting, sign-up cap, or per-user storage limit. Add them before the tracker gets real traffic.
- New accounts start with the schema defaults (`America/Denver`, pounds, miles). There is no settings screen yet; change `tracker_users` directly.

## Neon setup

1. Run [`db/migrations/001_tracker.sql`](../db/migrations/001_tracker.sql), then [`002_habit_intervals.sql`](../db/migrations/002_habit_intervals.sql), in the Neon SQL editor. Both are idempotent and separate from the Snake schema in `db/snake-schema.sql`.
2. Add the values from [`.env.example`](../.env.example) to local development and to the Vercel project settings.
3. Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Create an OAuth client for at least one provider (below).
5. Redeploy after setting Vercel environment variables.

## OAuth setup

The redirect/callback URL is `<origin>/api/tracker/auth` for both providers, e.g. `https://your-domain/api/tracker/auth` and `http://localhost:3000/api/tracker/auth` for `vercel dev`.

- **Google**: Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application). Add the redirect URL(s) under "Authorized redirect URIs". Set `TRACKER_GOOGLE_CLIENT_ID` and `TRACKER_GOOGLE_CLIENT_SECRET`. While the consent screen is in "Testing", only listed test users can sign in; publish it to let anyone in.
- **GitHub**: Settings → Developer settings → OAuth Apps → New OAuth App. GitHub allows one callback URL per app, so use a second app for localhost. Set `TRACKER_GITHUB_CLIENT_ID` and `TRACKER_GITHUB_CLIENT_SECRET`.

To keep the pre-existing owner data attached to your own sign-in, also set `TRACKER_OWNER_GOOGLE_EMAIL` and/or `TRACKER_OWNER_GITHUB_ID` (your numeric GitHub account id, the `id` field at `https://api.github.com/users/<your-login>`; a login is not accepted because it can be renamed away and claimed by someone else). Without them, your sign-in creates a fresh account like anyone else's.

Set `TRACKER_PUBLIC_ORIGIN` if the site is reachable on more than one hostname and only one is registered with the provider. Vercel preview deployments have their own hostnames, so sign-in only works on hostnames registered as redirect URLs.

The seeded owner profile uses `America/Denver`, pounds, and miles. Strength is the primary workflow, while duration and distance fields support cardio. Weights and distances are normalized to kilograms and meters in Neon, then returned in the profile's display units.

## API

All payloads and responses use camelCase. Error responses have the shape `{ "error": "message" }` and do not expose database errors.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/tracker/auth` | Return `{ authenticated, providers }` |
| `GET` | `/api/tracker/auth?provider=google\|github` | Redirect to the provider's consent screen |
| `GET` | `/api/tracker/auth?code=…&state=…` | OAuth callback; redirects to `/tracker/`, or `/tracker/?auth_error=<code>` on failure |
| `DELETE` | `/api/tracker/auth` | Clear the session cookie |
| `GET` | `/api/tracker/bootstrap` | Profile, habits and recent entries, exercise catalog, routines, and 12 recent workouts with sets |
| `GET` | `/api/tracker/habits` | List habits; `?includeArchived=true` is optional |
| `POST` | `/api/tracker/habits` | Create a habit |
| `PATCH` | `/api/tracker/habits?id=<uuid>` | Update a habit |
| `DELETE` | `/api/tracker/habits?id=<uuid>` | Archive a habit without deleting history |
| `PUT` | `/api/tracker/habit-entries` | Create or replace one habit/date entry |
| `DELETE` | `/api/tracker/habit-entries?habitId=<uuid>&entryDate=YYYY-MM-DD` | Delete one entry |
| `GET` | `/api/tracker/exercises` | List the active exercise library |
| `POST` | `/api/tracker/exercises` | Add a custom exercise (`name`, `category`, optional `muscleGroup`, `trackingType` of `weight_reps`/`reps`/`duration`/`distance`); a name already in the library returns `409`, and an archived one is restored |
| `GET` | `/api/tracker/routines` | List routine templates |
| `POST` | `/api/tracker/routines` | Create a routine template and its exercises |
| `PATCH` | `/api/tracker/routines?id=<uuid>` | Rename a routine and replace its exercise list (same body as `POST`; each exercise may appear once) |
| `GET` | `/api/tracker/workouts` | Workout history; use `?id=<uuid>` for nested details and `?limit=20` for summaries |
| `POST` | `/api/tracker/workouts` | Atomically save a completed nested workout |

`GET /api/tracker/bootstrap?from=YYYY-MM-DD` controls the earliest habit-entry date returned. Without it, the API returns roughly 90 days.

### Habit example

The frontend names scheduled weekdays `specific_days`; the database represents the same value as `weekdays`.

`frequencyType` is one of:

- `daily`: due every day.
- `specific_days`: due on `daysOfWeek` (0 = Sunday).
- `weekly`: done `targetDaysPerWeek` times per Monday-to-Sunday week ("Once a week" in the form sends `1`).
- `interval`: done `intervalCount` times in each window of `intervalDays` days (1–90), counted from the habit's start date.

`weekly` and `interval` habits stay on Today until the current window's goal is met, and their streaks count windows rather than days.

```json
{
  "name": "Read",
  "description": "Focused reading",
  "trackingType": "duration",
  "targetValue": 30,
  "unit": "minutes",
  "frequencyType": "specific_days",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "color": "#2f6b4f"
}
```

Log or toggle it with:

```json
{
  "habitId": "00000000-0000-4000-8000-000000000000",
  "entryDate": "2026-09-21",
  "value": 30,
  "status": "complete",
  "note": null
}
```

Statuses are `complete`, `partial`, or `skipped`. A missing date means no entry rather than an automatically stored failure.

### Routine example

```json
{
  "name": "Upper A",
  "exercises": [
    {
      "exerciseId": "00000000-0000-4000-8000-000000000000",
      "position": 1,
      "targetSets": 3,
      "targetRepsMin": 8,
      "targetRepsMax": 12,
      "targetWeight": 135,
      "restSeconds": 120
    }
  ]
}
```

Exercise ids come from `bootstrap.exercises`. `targetRepsMin`/`targetRepsMax` set a rep range (`targetReps` alone sets both ends to the same number). `targetWeight` and `targetDistance` use the signed-in user's profile units.

### Completed workout example

```json
{
  "routineId": null,
  "name": "Upper A",
  "startedAt": "2026-09-21T22:00:00.000Z",
  "endedAt": "2026-09-21T22:45:00.000Z",
  "notes": "Felt good",
  "exercises": [
    {
      "exerciseId": "00000000-0000-4000-8000-000000000000",
      "position": 1,
      "sets": [
        {
          "position": 1,
          "setType": "working",
          "weight": 135,
          "weightUnit": "lb",
          "reps": 8,
          "rpe": 7.5,
          "completed": true
        }
      ]
    }
  ]
}
```

Sets can also contain `durationSeconds`, `distance`, and `distanceUnit` (`mi` or `km`). Set types are `warmup`, `working`, `drop`, `failure`, and `cooldown`. At least one tracked metric is required per set.

## Schema outline

- `tracker_users`: one row per account, with preferences and display units.
- `tracker_habits` / `tracker_habit_entries`: schedules, values, notes, and target snapshots for historical accuracy.
- `tracker_exercises`: seeded strength, bodyweight, timed, and distance exercise catalog.
- `tracker_routines` / `tracker_routine_exercises`: ordered templates and targets.
- `tracker_workouts` / `tracker_workout_exercises` / `tracker_workout_sets`: completed session history, exercise snapshots, sets, reps, load, RPE, time, and distance.

Child foreign keys include `user_id`, so records cannot be linked across accounts.
