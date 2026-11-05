# Snake + Spotify Project Guide

This is the technical readme for the Snake + Spotify portfolio project.

It explains the project structure, the current architecture, how the pieces communicate, what data lives in Neon, and what still needs to be built.

## What This Project Is

The goal is to turn the older networked C# Snake project into a portfolio-hosted multiplayer experience with room-based play and Spotify-backed host listening sessions.

The website is the public shell and control plane.

That means the portfolio is responsible for:
- room creation and join UX
- player identity at the portfolio layer
- room metadata and status views
- Spotify room/session state
- durable match history and leaderboard views

The actual Snake simulation should eventually live in a separate realtime service.

## Current State

Implemented now:
- dedicated Snake project page
- room create/join API routes
- Neon schema for rooms, players, matches, and Spotify metadata
- leaderboard and recent match read endpoints
- room-specific Spotify status read endpoint
- legacy C# audit notes and project plan documents

Not implemented yet:
- browser-playable Snake client
- realtime authoritative game service
- Spotify OAuth and token refresh flow
- true match lifecycle writes from a realtime service into Neon

## Main Parts Of The System

### Portfolio frontend

Files:
- [snake.html](/Users/roscoe/Documents/Portfolio/apps/portfolio/snake.html)
- [snake.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/snake.js)
- [styles.css](/Users/roscoe/Documents/Portfolio/apps/portfolio/styles.css)

Responsibilities:
- show the public project page
- create and join rooms
- show current room snapshot
- show Spotify room status
- show leaderboard and recent match history

This layer talks to the Vercel API routes over HTTP.

### Portfolio API layer

Files:
- [db.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/db.js)
- [room.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/room.js)
- [highscores.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/highscores.js)
- [spotify-status.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/spotify-status.js)

Responsibilities:
- connect to Neon
- create rooms
- join rooms
- read room roster/snapshot data
- read leaderboard and recent match data
- read room-specific Spotify session state

These files are the control plane. They are not the live multiplayer game server.

### Neon database

File:
- [schema.sql](/Users/roscoe/Documents/Portfolio/apps/portfolio/schema.sql)

Stores:
- `snake_players`
- `snake_rooms`
- `snake_room_members`
- `snake_matches`
- `snake_match_players`
- `spotify_connections`
- `spotify_room_sessions`

Important boundary:
- Neon stores durable metadata
- Neon does not store tick-by-tick snake positions or realtime game state

### Future realtime game service

This service does not exist yet in the portfolio implementation.

It should eventually own:
- authoritative game loop
- movement and collision resolution
- food spawning
- player disconnect/rejoin gameplay behavior
- match start/end events

The current plan is to reuse ideas or code from the existing C# Snake project where it still makes sense.

## How The Parts Communicate

### Create room flow

1. User submits the create-room form on [snake.html](/Users/roscoe/Documents/Portfolio/apps/portfolio/snake.html).
2. [snake.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/snake.js) sends `POST /api/snake/room`.
3. [room.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/room.js):
   - inserts a player row
   - inserts a room row
   - inserts a host membership row
4. Neon stores the durable room state.
5. The response returns to the browser.
6. The frontend sets that room as the active room for future room-specific requests.

### Join room flow

1. User submits room id and player name.
2. [snake.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/snake.js) sends `GET /api/snake/room?roomId=...&playerName=...`.
3. [room.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/room.js):
   - verifies the room exists
   - inserts a player row
   - inserts a room membership row
   - returns the room snapshot and roster
4. The frontend updates the active room state.

### Spotify status flow

1. The browser keeps track of the active room id.
2. [snake.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/snake.js) calls `GET /api/snake/spotify-status?roomId=...`.
3. [spotify-status.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/spotify-status.js) reads `spotify_room_sessions`.
4. The browser renders host connection and track snapshot info.

Current limitation:
- this is read-only until Spotify OAuth and token persistence are added

### Leaderboard flow

1. The browser calls `GET /api/snake/highscores`.
2. [highscores.js](/Users/roscoe/Documents/Portfolio/apps/portfolio/api/snake/highscores.js):
   - derives leaderboard rows from `snake_match_players`
   - reads recent match history from `snake_matches`
3. The browser renders scores and recent activity.

### Future match finalization flow

This is the intended shape, but it is not fully implemented yet.

1. Realtime game service starts a match.
2. Realtime game service runs the game loop.
3. At match end, it sends a summary/result payload to the control plane.
4. The control plane writes match summary rows into Neon.
5. The leaderboard and recent history update from those durable rows.

## Why The API Layer Matters

The Vercel API routes exist to separate durable app concerns from realtime game concerns.

That separation matters because:
- room and Spotify metadata fit naturally in serverless/database flows
- realtime multiplayer simulation does not
- the portfolio frontend should not talk directly to Neon from the browser
- the control plane becomes the stable boundary between UI and future game backend

## Environment

Required environment variable:
- `DATABASE_URL`

Expected behavior:
- if `DATABASE_URL` is present and valid, the routes should return `"source":"neon"`
- if not, some frontend flows still fall back to `"source":"prototype"` for development/demo safety

## Useful Project Docs

- Product plan: [SNAKE_SPOTIFY_PLAN.md](/Users/roscoe/Documents/Portfolio/apps/portfolio/SNAKE_SPOTIFY_PLAN.md)
- Status board: [tasklist.md](/Users/roscoe/Documents/Portfolio/apps/portfolio/tasklist.md)
- Neon schema: [schema.sql](/Users/roscoe/Documents/Portfolio/apps/portfolio/schema.sql)
- Legacy integration summary: [SNAKE_LEGACY_AUDIT.md](/Users/roscoe/Documents/Portfolio/apps/portfolio/SNAKE_LEGACY_AUDIT.md)

## Next Technical Steps

- add match lifecycle endpoints
- define the contract with the future realtime game service
- implement Spotify OAuth/token storage
- make the browser client playable
- wire real match finalization into Neon
- run deployed end-to-end verification against Vercel + Neon
