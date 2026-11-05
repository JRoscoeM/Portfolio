# Snake Portfolio Integration Audit

## Current solution layout
- `Snake.sln` contains three projects: `GUI`, `GUI.Client`, and `WebServer`.
- The existing browser-facing UI is Blazor-based and centered around `GUI.Client/Pages/SnakeGUI.razor` plus `SnakeGUI.razor.cs`.
- Networking is handled in `GUI.Client/Controllers/NetworkConnection.cs` and `GUI.Client/Controllers/NetworkController.cs`.

## Reusable pieces
- `GUI.Client/Models/World.cs` is a useful room/world snapshot container.
- `GUI.Client/Models/Snake.cs`, `Powerup.cs`, `Wall.cs`, and `Point2D.cs` are good protocol/domain candidates once cleaned up.
- `NetworkConnection` and `NetworkController` preserve the existing message flow and server assumptions, which is valuable for a future compatibility layer.

## Extraction blockers
- The current client logic mixes rendering, connection management, and game loop concerns inside `SnakeGUI.razor.cs`.
- `NetworkController` writes directly to a database during gameplay, which couples match processing to persistence.
- `GUI.Client/Models/Database.cs` is hard-wired to a legacy MySQL database with embedded credentials and should not survive into production.
- The current UI connects to `localhost:11000`, so it is not deployment-ready for Vercel-hosted browser clients.

## Recommended boundary split
- `game-core`: world state, snake/powerup/wall models, movement/collision/scoring rules, and serialization contracts.
- `realtime-service`: authoritative multiplayer loop, room process ownership, and websocket or TCP gateway concerns.
- `portfolio-control-plane`: room creation, lobby metadata, Spotify ownership, persistent scores, and match history APIs.
- `browser-client`: room UX, canvas rendering, music state display, and transport integration with the realtime service.

## Immediate next steps
- Extract the pure models into a shared library or mirrored TypeScript contracts.
- Remove database writes from the network parsing path and replace them with match summary events.
- Document the server protocol from observed JSON message shapes before rewriting the browser client.
- Add tests around reusable game state before changing the transport layer.
