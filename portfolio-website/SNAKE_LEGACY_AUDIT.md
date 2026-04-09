# Snake Legacy Audit Reference

The detailed legacy audit currently lives in:

- [PORTFOLIO_INTEGRATION_AUDIT.md](/Users/roscoe/Documents/Portfolio/snake-game/PORTFOLIO_INTEGRATION_AUDIT.md)

This reference exists inside `portfolio-website` so the public Snake docs have a deployable documentation path.

## Short Version

### Reusable or partially reusable
- world/domain models
- snake, wall, powerup, and point concepts
- multiplayer/server protocol ideas

### Current blockers
- old UI is tightly coupled to Blazor client rendering
- networking, rendering, and gameplay concerns are mixed together
- database writes happen directly inside gameplay/network parsing
- old setup assumes `localhost:11000`
- old DB code targets a hard-coded MySQL database and must not be reused as-is

### Migration direction
- keep durable state in Neon
- keep realtime simulation out of Neon
- use the portfolio as the control plane
- adapt or preserve useful game-core logic while replacing the old UI path
