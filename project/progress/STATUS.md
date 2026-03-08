# Daemon MVP — Project Status

**Last updated:** 2026-03-07
**Hackathon:** Open Metaverse Hackathon (March 7-8, 2026)
**Current tier:** Tier 2 READY (fabric connected, pending browser sync test)

---

## Fabric Credentials

- **Team:** team011
- **SSH:** `ssh team011@hackathon.rp1.dev`
- **Fabric URL:** `https://team011.hackathon.rp1.dev/fabric/`
- **Admin Key:** `UOV9aRMh`
- **Scene:** `daemon-social-space` (id: `physical:1`)
- **ManifolderMCP profile:** `hackathon`

## Goals Tracker

| ID | Goal | Status | Notes |
|----|------|--------|-------|
| G1 | Form swapping | DONE | All 8 forms swap via `setForm()`, proper disposal |
| G2 | Serialization + MSF bridge | DONE | `toSerializable()`, `MSFBridge`, dual-mode `PeerManager` |
| G3 | Connect to MSF fabric | DONE | ManifolderMCP connected, scene created, objects verified |
| G4 | Real MSF peers | READY TO TEST | Needs two-browser test with fabric connection |
| G5 | Demo-ready experience | IN PROGRESS | Needs testing pass + deploy |

## Phase Completion

| Phase | Description | Status | ADR |
|-------|-------------|--------|-----|
| 1 | Form swapping | DONE | [ADR-001](../adr/001-form-swapping-architecture.md) |
| 2 | Serialization + polish | DONE | [ADR-003](../adr/003-daemon-serialization.md) |
| 3 | MSF bridge + config UI + dual-mode peers | DONE | [ADR-002](../adr/002-msf-bridge-dual-mode-peers.md) |
| 4 | ManifolderMCP setup | DONE | Scene `daemon-social-space` created, test object verified |
| 5 | Deploy + demo prep | NOT STARTED | — |

## Tier 1 Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| Build clean | PASS | `npm run build` succeeds, 17 modules |
| Snyk scan | PASS | 0 issues found |
| Dev server | PASS | Vite serves all modules, page loads |
| Form swap all 8 forms | NEEDS MANUAL | Click each form card in drawer |
| Form swap during resonance | NEEDS MANUAL | Change form while resonating |
| State + topic changes | NEEDS MANUAL | All states, toggle topics |
| Rapid state changes | NEEDS MANUAL | Spam buttons, check stability |
| Mobile browser | NEEDS MANUAL | Touch controls + UI |
| Config UI skip flow | NEEDS MANUAL | Load -> Skip -> simulated peers |
| Sim peers show form variety | NEEDS MANUAL | Peers should have random forms |

## Tier 2 Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| ManifolderMCP create scene | PASS | `daemon-social-space` created |
| ManifolderMCP create object | PASS | Test object created at (0, 1.8, 0) |
| ManifolderMCP list objects | PASS | Scene hierarchy visible |
| MSF connect from browser | NEEDS MANUAL | Enter fabric URL + key in config UI |
| Two-player sync | NEEDS MANUAL | Two browser tabs |
| State propagation | NEEDS MANUAL | Change state, verify in other tab |
| Resonance with real peers | NEEDS MANUAL | Both select topics, walk close |
| Manifolder visibility | NEEDS MANUAL | Check scene at fabric URL |

## Blockers

| Blocker | Since | Action | Status |
|---------|-------|--------|--------|
| RP1 signup portal down | 2026-03-07 | Completed signup | RESOLVED |

## Next Steps (Priority Order)

1. Manual browser testing (form swap, config UI, sim peers)
2. Two-browser fabric sync test
3. Deploy to GitHub Pages (Phase 5)
4. Demo prep

## Architecture Decisions

See `project/adr/` for full records:
- [ADR-001](../adr/001-form-swapping-architecture.md) — Form swapping via `formGroup` + dispose
- [ADR-002](../adr/002-msf-bridge-dual-mode-peers.md) — MSF bridge + dual-mode peers
- [ADR-003](../adr/003-daemon-serialization.md) — Serialization format
- [ADR-004](../adr/004-gotcha-atlas-framework.md) — GOTCHA/ATLAS frameworks
- [ADR-005](../adr/005-project-docs-location.md) — Moved project docs to `project/` (Vite build was wiping `docs/`)
