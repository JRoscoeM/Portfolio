# Portfolio Monorepo

This repository contains the source for my portfolio site and its projects

Anyone may use this code as the wish as long as the project it's used for is also open-source according to GPLv3

Each application remains independently buildable. The repository shares presentation,
contracts, documentation, and CI conventions without forcing every project into one
language or runtime.

## Applications

- `apps/portfolio`: Vercel-hosted portfolio site, the Daily Log tracker, and lightweight API routes
- `apps/recipes`: Django recipe-sharing application (Group Cookbook)
- `apps/snake`: C# and Blazor Snake application source
- `apps/spreadsheet`: C# spreadsheet engine and Blazor WebAssembly frontend
- `apps/sprite-editor`: C++/Qt sprite editor, including the WebAssembly target

## Database ownership

Each set of tables has one migration owner:

- Django migrations own the recipe and Django authentication tables.
- `apps/portfolio/db/snake-schema.sql` owns the Snake room, player, and match-history tables.
- `apps/portfolio/db/migrations/` owns the tracker tables.

Hand-written SQL must not redefine tables already managed by Django.
