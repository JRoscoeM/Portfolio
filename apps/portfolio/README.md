# Portfolio Website

The Vercel-hosted portfolio site: static pages at the project root plus serverless API routes under `api/`.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `static/` | Home page, its script, styles, and profile images |
| `tracker/` | Daily Log, the habit and workout tracker (served at `/tracker/`) |
| `vercel.json` | Headers for the WebAssembly build, and the proxy that serves Group Cookbook (`apps/recipes`, its own Vercel project) at `/recipes/` |
| `A7.html`, `A7.js`, `A7.wasm`, `qtloader.js` | Sprite Editor WebAssembly build (served at `/A7.html`); built from `apps/sprite-editor` |
| `snake.html`, `snake.js`, `snake-play.html`, `snake-play.js` | Snake + Spotify room console (in development) |
| `api/tracker/` | Tracker API: OAuth sign-in and per-user data routes |
| `api/snake/` | Snake control-plane API: rooms, leaderboard, Spotify status |
| `api/_lib/` | Shared server-side helpers; not deployed as routes |
| `db/` | SQL: `migrations/001_tracker.sql` (tracker) and `snake-schema.sql` (Snake) |
| `docs/` | `TRACKER.md` and the Snake docs in `docs/snake/` |
| `tests/` | Node test suite for the tracker API |

Page and asset paths at the project root are public URLs, so moving them changes the live site.

## Development

```bash
npm install
npm test          # tracker API tests
npm run check     # syntax check + tests
```

Environment variables are listed in [`.env.example`](.env.example). Tracker setup, including the OAuth clients, is in [docs/TRACKER.md](docs/TRACKER.md).

## Docs

- Tracker backend: [docs/TRACKER.md](docs/TRACKER.md)
- Snake + Spotify: [guide](docs/snake/README.md), [plan](docs/snake/PLAN.md), [task list](docs/snake/TASKLIST.md), [legacy audit](docs/snake/LEGACY_AUDIT.md)
