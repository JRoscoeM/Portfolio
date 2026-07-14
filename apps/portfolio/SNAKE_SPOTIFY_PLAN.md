# Portfolio Snake + Spotify Integration Plan

## Summary
Build a new multiplayer Snake experience as a dedicated section of the existing Vercel-hosted portfolio, while preserving as much useful C# game logic as possible. Use the current portfolio site as the presentation shell, Neon for durable app data, Spotify for room music integration, and a separate real-time backend service for the authoritative multiplayer game loop if the existing C# server architecture is viable.

## Key Changes
- Add a new portfolio project route/page for Snake that introduces the game, explains the multiplayer/music concept, and launches the playable client.
- Treat the portfolio site as the public frontend and control plane:
  it should handle room creation/join UI, player identity, lobby metadata, Spotify OAuth/session setup, and display of room/music state.
- Keep Neon as the persistence layer for:
  room metadata, match history, high scores, Spotify room ownership/tokens, and lightweight social state.
- Use a dedicated real-time game service for the actual multiplayer simulation if the C# source confirms an authoritative server design.
  Default assumption: the game server stays in .NET rather than being rewritten immediately.
- Define Spotify v1 as host-controlled listening:
  one room host connects Spotify, room members see the active track/session state, and the host controls playback for the room experience.
- Keep the current portfolio site framework-light unless inspection of the live code argues otherwise.
  No forced migration to Next.js in phase 1; add only the minimum frontend structure needed for the Snake feature.

## Implementation Changes
- Audit the `snake-game` solution first and classify code into:
  reusable game rules/state, reusable networking/protocol pieces, UI-specific code, and deployment blockers.
- Extract or preserve a clean game-core boundary so the simulation logic can be tested independently from the old client UI.
- Decide the browser client path after source inspection:
  preferred default is a web client that reuses protocol/game concepts while replacing the original C# desktop UI.
- Add portfolio-side API endpoints for:
  room creation/join metadata, Spotify OAuth callback/token storage, high score submission, and match history retrieval.
- Add a small shared room model in Neon with fields for:
  room id, host player, game status, Spotify connection status, current track snapshot, and timestamps.
- Keep real-time gameplay traffic off Neon.
  Neon stores durable state and summaries; the live game loop and tick-to-tick player updates stay in the real-time service.
- Add deployment topology documentation:
  Vercel hosts the portfolio frontend and lightweight APIs; the real-time server runs separately and is reachable by the browser game client.

## Test Plan
- Verify the existing Snake solution builds locally from source and document the run flow for server and client.
- Add tests around extracted game-core logic:
  movement, collisions, food spawning rules, scoring, player join/leave behavior, and game-over handling.
- Add integration checks for room lifecycle:
  create room, join room, host disconnect, game start/end, high score persistence.
- Add Spotify integration checks for:
  OAuth connection, token refresh, host-controlled playback state retrieval, and graceful behavior when Spotify is unavailable.
- Validate end-to-end deployment flow:
  portfolio page loads on Vercel, room APIs can reach Neon, and the web client can connect to the real-time game service.

## Assumptions
- The existing C# source is now available under `snake-game`, but the exact solution layout still needs one inspection pass before implementation details are finalized.
- The current portfolio remains a mostly static Vercel site rather than being migrated to a heavier framework in phase 1.
- Spotify v1 is social listening with one host controlling the room, not a collaborative voting/queue system.
- Reusing the C# multiplayer server is preferred over a full rewrite unless inspection shows the code is too tightly coupled to desktop-specific UI/runtime concerns.
- Vercel + Neon remain the right home for the website, persistence, and OAuth flows, but not for the authoritative always-on multiplayer loop.
