# Portfolio Monorepo

This repository contains the source for the portfolio site and its interactive projects.

## Layout

```text
apps/       User-facing websites, browser applications, and desktop application source
services/   Independently deployed backend services
packages/   Shared contracts and design assets
database/   Database migration ownership and database documentation
deploy/     Infrastructure and deployment configuration
docs/       Cross-project architecture and decision records
```

Each application remains independently buildable. The repository shares presentation,
contracts, documentation, and CI conventions without forcing every project into one
language or runtime.

## Applications

- `apps/portfolio`: Vercel-hosted portfolio shell and lightweight API routes
- `apps/recipes`: Django recipe-sharing application
- `apps/snake`: C# and Blazor Snake application source
- `apps/spreadsheet`: C# spreadsheet engine and Blazor WebAssembly frontend
- `apps/sprite-editor`: C++/Qt sprite editor, including the WebAssembly target
- `apps/simon-game`: C++/Qt Simon game
- `apps/polluting-computing`: C++/Qt project

Generated dependencies and build output are intentionally excluded from source control.
