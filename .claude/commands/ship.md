# /ship — Daemon Project Ship Cycle

## Purpose
End-to-end shipping workflow for the daemon-mvp project. Covers build verification, progress tracking, ADR review, and deployment readiness. Evolves as the project evolves.

## Usage
```
/ship [phase]
```

Phases: `status`, `build`, `test`, `deploy`, `adr`, `plan`
No argument = full cycle (status → build → test → summary).

## Workflow

### 1. Status Check
- Read `docs/progress/STATUS.md` for current state
- Read latest ADRs in `docs/adr/` for recent decisions
- Run `git status` and `git log --oneline -5` for repo state
- Report: what's done, what's in progress, what's blocked

### 2. Build Verification
- Run `npm run build` — must pass clean
- Run Snyk code scan on `src/` — must show 0 issues
- Report any TypeScript or bundling errors

### 3. Test Pass
- If dev server is needed, start with `npm run dev`
- Run through Tier 1 test checklist from `docs/progress/STATUS.md`
- Report test results

### 4. Deploy
- `npm run build` (production)
- Verify `docs/` output directory is populated
- Stage and commit build artifacts if requested
- Push to GitHub Pages if requested

### 5. ADR Management (`/ship adr`)
- List all ADRs in `docs/adr/`
- Check for any decisions marked "proposed" that need resolution
- Prompt: "Any new architectural decisions to record?"
- Create new ADR from template if needed

### 6. Plan Review (`/ship plan`)
- Review `docs/progress/STATUS.md` against the integration plan
- Identify next unblocked work items
- Check if any blocked items have become unblocked
- Update STATUS.md with current state

## ADR Format
ADRs live in `docs/adr/` and follow the naming convention `NNN-title.md`.
Template: `docs/adr/000-template.md`

## Progress Tracking
- `docs/progress/STATUS.md` — single source of truth for project state
- Updated by `/ship status` and `/ship plan`
- Tracks: completed work, in-progress items, blockers, next steps

## Evolution Notes
This skill will grow with the project. When new capabilities are added (e.g., MSF integration testing, multi-browser sync tests, demo recording), update this file to include those steps in the workflow.
