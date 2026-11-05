# Personal Tracker Backend

This is the server-side baseline for the habit and workout tracker. It is designed for one private owner account plus a frontend-only guest demo.

## Privacy boundary

- Owner requests authenticate with `TRACKER_OWNER_PASSCODE` and receive a signed, seven-day, `HttpOnly`, `SameSite=Strict` cookie.
- Every Neon query uses the server-owned `owner` subject. The API never accepts a browser-supplied user id.
- All data routes return `401` without a valid owner cookie.
- Guest mode must use local/demo data in the browser and must not call any `/api/tracker/*` data route.
- Missing `DATABASE_URL`, `TRACKER_OWNER_PASSCODE`, or `TRACKER_SESSION_SECRET` fails closed with `503`.
- This is intentionally lightweight personal authentication. Before supporting other real users, replace it with managed identity, CSRF protections appropriate to that flow, and rate limiting.

## Neon setup

1. Run [`db/migrations/001_tracker.sql`](../db/migrations/001_tracker.sql) in the Neon SQL editor. It is idempotent and separate from the legacy root `schema.sql`.
2. Add the three values from [`.env.example`](../.env.example) to local development and to the Vercel project settings.
3. Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Redeploy after setting Vercel environment variables.

The seeded owner profile uses `America/Denver`, pounds, and miles. Strength is the primary workflow, while duration and distance fields support cardio. Weights and distances are normalized to kilograms and meters in Neon, then returned in the profile's display units.

## API

All payloads and responses use camelCase. Error responses have the shape `{ "error": "message" }` and do not expose database errors.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/tracker/auth` | Return `{ authenticated }` |
| `POST` | `/api/tracker/auth` | Sign in with `{ passcode }` |
| `DELETE` | `/api/tracker/auth` | Clear the session cookie |
| `GET` | `/api/tracker/bootstrap` | Owner profile, habits and recent entries, exercise catalog, routines, and 12 recent workouts with sets |
| `GET` | `/api/tracker/habits` | List habits; `?includeArchived=true` is optional |
| `POST` | `/api/tracker/habits` | Create a habit |
| `PATCH` | `/api/tracker/habits?id=<uuid>` | Update a habit |
| `DELETE` | `/api/tracker/habits?id=<uuid>` | Archive a habit without deleting history |
| `PUT` | `/api/tracker/habit-entries` | Create or replace one habit/date entry |
| `DELETE` | `/api/tracker/habit-entries?habitId=<uuid>&entryDate=YYYY-MM-DD` | Delete one entry |
| `GET` | `/api/tracker/routines` | List routine templates |
| `POST` | `/api/tracker/routines` | Create a routine template and its exercises |
| `GET` | `/api/tracker/workouts` | Workout history; use `?id=<uuid>` for nested details and `?limit=20` for summaries |
| `POST` | `/api/tracker/workouts` | Atomically save a completed nested workout |

`GET /api/tracker/bootstrap?from=YYYY-MM-DD` controls the earliest habit-entry date returned. Without it, the API returns roughly 90 days.

### Habit example

The frontend names scheduled weekdays `specific_days`; the database represents the same value as `weekdays`.

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
      "targetReps": 8,
      "targetWeight": 135,
      "restSeconds": 120
    }
  ]
}
```

Exercise ids come from `bootstrap.exercises`. `targetWeight` and `targetDistance` use the owner's profile units.

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

- `tracker_users`: singleton owner preferences and display units.
- `tracker_habits` / `tracker_habit_entries`: schedules, values, notes, and target snapshots for historical accuracy.
- `tracker_exercises`: seeded strength, bodyweight, timed, and distance exercise catalog.
- `tracker_routines` / `tracker_routine_exercises`: ordered templates and targets.
- `tracker_workouts` / `tracker_workout_exercises` / `tracker_workout_sets`: completed session history, exercise snapshots, sets, reps, load, RPE, time, and distance.

Child foreign keys include `user_id` so records cannot be linked across owners if multi-user authentication is added later.
