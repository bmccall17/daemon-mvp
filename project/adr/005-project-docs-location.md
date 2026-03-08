# ADR-005: Project Docs Moved to `project/` Directory

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett, Claude

## Context
ADRs and progress tracking were originally placed in `docs/adr/` and `docs/progress/`. However, Vite's build output is configured to `outDir: 'docs'` for GitHub Pages deployment. Vite's default `emptyOutDir: true` wipes the entire `docs/` directory on every build, destroying all ADRs and progress files.

This was discovered during the `/ship` cycle when `npm run build` deleted all project documentation.

## Decision
Moved all project documentation to `project/` directory:
- `project/adr/` — Architecture Decision Records
- `project/progress/` — Status tracking

The `docs/` directory is now exclusively Vite build output (GitHub Pages).

## Consequences
- **Fixed:** `npm run build` no longer destroys project documentation
- **Easier:** Clear separation between build artifacts and project knowledge
- **Trade-off:** None significant. The `/ship` skill and MEMORY.md updated to reflect new paths.

## Alternatives Considered
1. **Set `emptyOutDir: false` in Vite config** — Leaves stale build assets; fragile
2. **Change build output to `dist/`** — Would break existing GitHub Pages setup
