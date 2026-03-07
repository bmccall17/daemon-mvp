# Daemon MVP — Project Status

**Last updated:** 2026-03-07
**Hackathon:** Open Metaverse Hackathon (March 7-8, 2026)
**Current tier:** Tier 1 (standalone, no fabric connection)

---

## Goals Tracker

| ID | Goal | Status | Notes |
|----|------|--------|-------|
| G1 | Form swapping | DONE | All 8 forms swap via `setForm()`, proper disposal |
| G2 | Serialization + MSF bridge | DONE | `toSerializable()`, `MSFBridge`, dual-mode `PeerManager` |
| G3 | Connect to MSF fabric | BLOCKED | Portal `signup.hackathon.rp1.dev` not resolving |
| G4 | Real MSF peers | BLOCKED | Depends on G3 |
| G5 | Demo-ready experience | IN PROGRESS | Needs testing pass + deploy |

## Phase Completion

| Phase | Description | Status | ADR |
|-------|-------------|--------|-----|
| 1 | Form swapping | DONE | [ADR-001](../adr/001-form-swapping-architecture.md) |
| 2 | Serialization + polish | DONE | [ADR-003](../adr/003-daemon-serialization.md) |
| 3 | MSF bridge + config UI + dual-mode peers | DONE | [ADR-002](../adr/002-msf-bridge-dual-mode-peers.md) |
| 4 | ManifolderMCP setup | BLOCKED | Waiting on portal |
| 5 | Deploy + demo prep | NOT STARTED | — |

## Tier 1 Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| Form swap all 8 forms | NOT TESTED | Click each form card in drawer |
| Form swap during resonance | NOT TESTED | Change form while resonating |
| State + topic changes | NOT TESTED | All states, toggle topics |
| Rapid state changes | NOT TESTED | Spam buttons, check stability |
| Mobile browser | NOT TESTED | Touch controls + UI |
| Config UI skip flow | NOT TESTED | Load → Skip → simulated peers |
| Sim peers show form variety | NOT TESTED | Peers should have random forms |
| Build clean | PASS | `npm run build` succeeds |
| Snyk scan | PASS | 0 issues found |

## Tier 2 Test Checklist (when fabric available)

| Test | Status | Notes |
|------|--------|-------|
| MSF connect/disconnect | BLOCKED | — |
| Two-player sync | BLOCKED | — |
| State propagation | BLOCKED | — |
| Resonance with real peers | BLOCKED | — |
| Manifolder visibility | BLOCKED | — |

## Blockers

| Blocker | Since | Action | Status |
|---------|-------|--------|--------|
| RP1 signup portal down | 2026-03-07 | Periodically retry `signup.hackathon.rp1.dev` | WAITING |

## Files Changed (This Session)

| File | Change |
|------|--------|
| `src/daemon.ts` | Rewritten: `setForm()`, `formGroup`, `toSerializable()`, `getFormId()` |
| `src/main.ts` | Rewritten: config UI flow, MSF bridge init, publish loop, status dot |
| `src/peers.ts` | Rewritten: dual-mode (simulated/MSF), random forms for sim peers |
| `src/form-selector.ts` | `build()` signature → `THREE.Object3D`, added `getFormById()` |
| `src/types.ts` | Added `MSFConfig`, extended `PeerState` with `formId`/`lastUpdate` |
| `src/msf-bridge.ts` | NEW: MSF abstraction layer |
| `src/config-ui.ts` | NEW: Fabric credential input overlay |

## Next Steps (Priority Order)

1. Run dev server, test form swapping manually
2. Test config UI skip flow
3. Verify sim peer form variety
4. Deploy to GitHub Pages
5. Retry hackathon portal
6. If portal up: complete Phase 4 (ManifolderMCP setup) and Phase 5 (deploy + demo)

## Architecture Decisions

See `docs/adr/` for full records:
- [ADR-001](../adr/001-form-swapping-architecture.md) — Form swapping via `formGroup` + dispose
- [ADR-002](../adr/002-msf-bridge-dual-mode-peers.md) — MSF bridge + dual-mode peers
- [ADR-003](../adr/003-daemon-serialization.md) — Serialization format
- [ADR-004](../adr/004-gotcha-atlas-framework.md) — GOTCHA/ATLAS frameworks
