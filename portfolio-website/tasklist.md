# Snake + Spotify Task List

This file translates the integration plan into a working status board for the current repo.

## Current Phase
- Phase 1: portfolio control plane and persistence foundation

## Done
- Added the official project plan: [SNAKE_SPOTIFY_PLAN.md](/Users/roscoe/Documents/Portfolio/portfolio-website/SNAKE_SPOTIFY_PLAN.md)
- Audited the legacy C# Snake project and documented integration blockers and reuse opportunities: [PORTFOLIO_INTEGRATION_AUDIT.md](/Users/roscoe/Documents/Portfolio/snake-game/PORTFOLIO_INTEGRATION_AUDIT.md)
- Added a dedicated Snake + Spotify project page: [snake.html](/Users/roscoe/Documents/Portfolio/portfolio-website/snake.html)
- Linked the Snake project from the main portfolio page: [index.html](/Users/roscoe/Documents/Portfolio/portfolio-website/index.html)
- Added PostgreSQL/Neon schema source of truth: [schema.sql](/Users/roscoe/Documents/Portfolio/portfolio-website/schema.sql)
- Created shared Neon helper for API routes: [db.js](/Users/roscoe/Documents/Portfolio/portfolio-website/api/snake/db.js)
- Implemented room create/join API flow against the Neon schema: [room.js](/Users/roscoe/Documents/Portfolio/portfolio-website/api/snake/room.js)
- Implemented leaderboard and recent match read endpoints from match tables: [highscores.js](/Users/roscoe/Documents/Portfolio/portfolio-website/api/snake/highscores.js)
- Implemented room-specific Spotify status read path: [spotify-status.js](/Users/roscoe/Documents/Portfolio/portfolio-website/api/snake/spotify-status.js)
- Updated the frontend room console to pass active room context into the Spotify status route: [snake.js](/Users/roscoe/Documents/Portfolio/portfolio-website/snake.js)
- Confirmed the Neon tables already exist

## In Progress
- Portfolio control plane architecture
  - Room creation and join flow exists
  - Neon-backed leaderboard/history reads exist
  - Frontend still includes a few prototype fallback paths for no-DB environments
- Room/music UI
  - The public-facing Snake page is live in the repo
  - Spotify UI currently reads room session state but does not yet perform OAuth
- Data model alignment
  - Schema is defined and checked into git
  - API handlers are being aligned to the schema as the control plane matures

## Blocked By Missing Backend Pieces
- Real score submission from the frontend
  - Current write path should come from real match finalization with a `matchId`
  - The browser UI intentionally does not fake this yet
- Spotify host connection flow
  - Requires OAuth callback, token storage, refresh behavior, and session creation
- True multiplayer gameplay
  - Requires a realtime service and browser client transport layer

## Next
- Add match lifecycle endpoints
  - Create match when gameplay begins
  - Finalize match when gameplay ends
  - Persist winner, summary, and player results
- Define the contract between the portfolio control plane and the future realtime game service
  - Match start payload
  - Match result payload
  - Room/player identity handoff
- Implement Spotify OAuth endpoints and token persistence
  - Connect host Spotify account
  - Store encrypted tokens
  - Create/update `spotify_room_sessions`
- Run a full deployed verification against Vercel + Neon
  - Create room from deployed site
  - Join room from deployed site
  - Verify data lands in Neon
  - Verify room-specific Spotify status reads correctly

## Important Architectural Notes
- Vercel API routes are the control plane, not the realtime game server
- Neon stores durable room, match, and Spotify metadata only
- Tick-by-tick gameplay state should not be written to Neon
- The future authoritative game loop should live in a separate realtime service, likely .NET unless the legacy code proves unusable

## Legacy Snake Extraction Work
- Extract or mirror clean domain contracts from the old C# project
  - `World`
  - `Snake`
  - `Wall`
  - `Powerup`
  - `Point2D`
- Remove database writes from gameplay parsing logic in the old code path
- Document the existing wire/protocol format from the legacy server
- Identify what can be reused as-is versus what must be rewritten for browser play

## Testing Checklist
- Local/API
  - Confirm `DATABASE_URL` is present locally
  - Verify `/api/snake/room` returns `"source":"neon"` locally
  - Verify `/api/snake/highscores` returns Neon-backed rows
- Hosted
  - Confirm `DATABASE_URL` exists in Vercel project settings
  - Deploy the portfolio site
  - Create a room from the hosted `snake.html`
  - Join that room from the hosted UI
  - Query Neon and confirm inserted rows exist
- Future gameplay
  - Add tests for extracted game-core rules
  - Add tests for match finalization and leaderboard updates
  - Add tests for Spotify token refresh and room session updates

## Nice To Have
- Add a docs index page for project docs
- Link the plan and task list from the Snake page
- Add a small admin/debug view for recent rooms and matches
- Add `updated_at` trigger support in PostgreSQL instead of handling every update manually in app code
