---
description: Daemon Project Ship Cycle
---

# /ship — Daemon Project Ship Cycle

## Purpose
End-to-end shipping workflow for the daemon-mvp project. Covers build verification, progress tracking, ADR review, and deployment readiness. Evolves as the project evolves.

## Usage
If the user specifies a phase (e.g. `/ship build`), execute only that phase. Otherwise, run the full cycle (status → build → test → deploy).

## Phases

### 1. status
1. Read `project/progress/STATUS.md` for current state.
2. Read latest ADRs in `project/adr/` for recent decisions.
// turbo
3. Run `git status` and `git log --oneline -5` for repo state.
4. Report: what's done, what's in progress, what's blocked.

### 2. build
// turbo-all
1. Run `npm run build` — must pass clean.
2. Run Snyk code scan on `src/` — must show 0 issues (or report if not available).
3. Report any TypeScript or bundling errors.

### 3. test
1. If dev server is needed, start with `npm run dev` in the background.
2. Run through Tier 1 test checklist from `project/progress/STATUS.md`.
3. Report test results.

### 4. deploy
// turbo
1. Run `npm run build` (production)
2. Verify `docs/` output directory is populated.
3. Stage and commit build artifacts if requested.
4. Push to GitHub Pages if requested.

### 5. adr
1. List all ADRs in `project/adr/`.
2. Check for any decisions marked "proposed" that need resolution.
3. Prompt: "Any new architectural decisions to record?"
4. Create new ADR from template (`project/adr/000-template.md`) if needed, ensuring the `AI Context` field accurately records the current model and UI (e.g., "Antigravity on Gemini 3.1 Pro (High)").

### 6. plan
1. Review `project/progress/STATUS.md` against the integration plan.
2. Identify next unblocked work items.
3. Check if any blocked items have become unblocked.
4. Update `project/progress/STATUS.md` with current state.

## ADR Format
ADRs live in `project/adr/` and follow the naming convention `NNN-title.md`.
Template: `project/adr/000-template.md`

## Progress Tracking
- `project/progress/STATUS.md` — single source of truth for project state
- Updated by `/ship status` and `/ship plan`
- Tracks: completed work, in-progress items, blockers, next steps
