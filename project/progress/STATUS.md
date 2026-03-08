# Daemon MVP — Project Status

**Last updated:** 2026-03-08 (end of Day 2 session 1)
**Hackathon:** Open Metaverse Hackathon (March 7-8, 2026)
**Current tier:** Tier 3 IN PROGRESS (RP1 service deployed, integration incomplete)

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
| G3 | Connect to MSF fabric | DONE | ManifolderMCP + browser ManifolderClient wired |
| G4 | Real MSF peers | DONE | Tested in multiplayer; ghost bug resolved |
| G5 | Demo-ready experience | DONE | Stable, deployed, and tested |
| G6 | RP1 daemon service | IN PROGRESS | REST API live, RP1 integration not yet verified |

## Phase Completion

| Phase | Description | Status | ADR |
|-------|-------------|--------|-----|
| 1 | Form swapping | DONE | [ADR-001](../adr/001-form-swapping-architecture.md) |
| 2 | Serialization + polish | DONE | [ADR-003](../adr/003-daemon-serialization.md) |
| 3 | MSF bridge + config UI + dual-mode peers | DONE | [ADR-002](../adr/002-msf-bridge-dual-mode-peers.md) |
| 4 | ManifolderMCP setup | DONE | Scene created, browser wiring complete |
| 5 | Deploy + demo prep | DONE | Deployed to GitHub Pages |
| 6 | RP1 daemon service | IN PROGRESS | REST API deployed, LnG wired, awaiting RP1 integration test |

## Tier 1 Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| Build clean | PASS | 17 modules, 547KB |
| Snyk scan | PASS | 0 issues |
| Dev server | PASS | All modules serve correctly |
| Form swap all 8 forms | PASS | Click each form card in drawer |
| Form swap during resonance | PASS | Change form while resonating |
| State + topic changes | PASS | All states, toggle topics |
| Config UI skip flow | PASS | Load -> Solo Mode -> simulated peers |
| Sim peers show form variety | PASS | Peers should have random forms |

## Tier 2 Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| ManifolderMCP create scene | PASS | `daemon-social-space` created |
| ManifolderMCP create/list objects | PASS | Full CRUD verified via MCP tools |
| Browser fabric connect | PASS | Enter creds, check green dot + console |
| Two-player sync | PASS | Two browser tabs |
| Daemon visible in Scene Assembler | PASS | Scene visible, ghosting bug fixed |
| Resonance with real peers | PASS | Both select topics, walk close |

## Blockers

| Blocker | Since | Action | Status |
|---------|-------|--------|--------|
| RP1 signup portal down | 2026-03-07 | Completed signup | RESOLVED |
| Cannot Load Scene in RP1 / `web/` returns 404 | 2026-03-08 | Used Antigravity to inject models directly to Scene Assembler (`daemon_coordinates.json`) | PARTIAL (visible in assembler) |
| RP1 service integration contract unknown | 2026-03-08 | REST API deployed + request logging enabled. LnG_Open added to rp1.js. "Begin Test" button in Dev Center non-functional. Need to discover what RP1 actually sends. | ACTIVE |

## Day 1 Summary (March 7)

All 5 phases complete. Built from zero to:
- 8 daemon forms with live swapping + proper WebGL disposal
- Serialization format for network sync
- MSF bridge abstraction (simulated fallback + real fabric)
- Config UI overlay with credential persistence
- Dual-mode peer manager (simulated/MSF)
- ManifolderMCP set up, connected, scene created
- ManifolderClient browser wiring (vendor scripts + runtime ESM injection)
- Deployed to GitHub Pages

## Day 2 Plan (March 8)

## Day 2 Plan (March 8)

1. ~~Manual browser testing: form swap, config UI flows, sim peer variety~~ (DONE)
2. ~~Fabric connection test: enter creds, verify green dot, check console~~ (DONE)
3. ~~Two-tab sync test: both tabs connected, see each other's daemons~~ (DONE)
4. ~~Fix MSF ghost object and spawn bug (ADR-007)~~ (DONE)
5. ~~Fix MSF `Data too long for column Name_wsRMPObjectId` DB Error by moving payload to properties~~ (DONE)
6. ~~Figure out how to load the `daemon-social-space` models. Loaded into Scene Assembler at Jordan College (Oxford, UK)! (ADR-009)~~ (DONE)
7. Demo prep: walkthrough script for judges
8. Polish if time: reconnect on drop, smoother sim peer wander patterns

## Tier 3: RP1 Service Integration

| Item | Status | Notes |
|------|--------|-------|
| `service/` directory created | DONE | Express server + daemon-routes.js |
| daemon-routes.js deployed to MSF | DONE | Co-hosted on port 3011 via mapbase.js |
| `/daemons/*` endpoints live over HTTPS | DONE | health, catalog, me, attach, detach, update |
| mvconfig.json deployed | DONE | At `https://team011.hackathon.rp1.dev/mvconfig.json` |
| LnG_Open added to rp1.js | DONE | Opens `bam/daemons` MVRest connection on fabric ready |
| RP1 Dev Center environment registered | DONE | Environment ID 21, endpoint registered |
| RP1 actually calling our service | NOT VERIFIED | No confirmed inbound requests from RP1 yet |
| "Begin Test" in Dev Center | BLOCKED | Button non-functional |
| Daemon visible above avatar in RP1 | NOT STARTED | Depends on understanding RP1's contract |

## Pickup Notes (for next session)

### What's working
- All `/daemons/*` REST endpoints are live and tested via curl
- Endpoint: `https://team011.hackathon.rp1.dev/daemons/health` (and /catalog, /me, /attach, /detach, /update)
- Service is co-hosted inside MSF Map Service (daemon-routes.js in ~/MSF_Map_Svc/dist/)
- mvconfig.json and LnG_Open front-end wiring are deployed

### What's NOT working yet
- No evidence RP1 is calling our service endpoints
- The LnG_Open in rp1.js fires but we don't know if MVRest actually hits our REST routes
- "Begin Test" button in RP1 Dev Center does nothing

### Where to pick up
1. **Check server logs first:** `ssh team011@hackathon.rp1.dev 'cat ~/msf.log | grep -i daemon'`
2. **If no RP1 requests visible:** The LnG_Open may need different params, or MVRest may use a different URL pattern than `/daemons/*`. Check browser console in Scene Assembler for errors.
3. **Ask RP1 mentors/staff:** "We registered a REST service and environment. How does the fabric client discover and call our service endpoints? Is LnG_Open the right approach, or should we use the service broker (MVSB) pattern?"
4. **If MSF service is down:** `ssh team011@hackathon.rp1.dev 'killall node; cd ~/MSF_Map_Svc/dist && nohup node server.js > ~/msf.log 2>&1 &'` (use ssh -f if needed)
5. **Fallback demo strategy:** If RP1 integration doesn't click, demo the standalone daemon-mvp (GitHub Pages) + show the live REST API as proof of service readiness

### Files modified on server (not in git)
- `~/MSF_Map_Svc/dist/mapbase.js` — added `require('./daemon-routes').mount(pApp)` before `this.#pServer.Run()`
- `~/MSF_Map_Svc/dist/daemon-routes.js` — NEW, daemon REST routes
- `~/MSF_Map_Svc/dist/web/mvconfig.json` — NEW, service broker config
- `~/MSF_Map_Svc/dist/web/js/rp1.js` — added LnG_Open for daemons (backup at rp1.js.bak)
- `~/MSF_Map_Svc/dist/mapbase.js` — backup at mapbase.js.bak

## Architecture Decisions

See `project/adr/` for full records:
- [ADR-001](../adr/001-form-swapping-architecture.md) — Form swapping via `formGroup` + dispose
- [ADR-002](../adr/002-msf-bridge-dual-mode-peers.md) — MSF bridge + dual-mode peers
- [ADR-003](../adr/003-daemon-serialization.md) — Serialization format
- [ADR-004](../adr/004-gotcha-atlas-framework.md) — GOTCHA/ATLAS frameworks
- [ADR-005](../adr/005-project-docs-location.md) — Moved project docs to `project/`
- [ADR-006](../adr/006-manifolderclient-browser-loading.md) — ManifolderClient browser loading strategy
- [ADR-007](../adr/007-msf-ghost-object-fix.md) — MSF Ghost Object and Spawn Bug Fix
- [ADR-008](../adr/008-rp1-viewer-handoff.md) — Handoff to Claude Code CLI for RP1 Viewer Blocker
- [ADR-009](../adr/009-rp1-model-integration.md) — RP1 Model Integration & Material Conversion
- [ADR-010](../adr/010-rp1-daemon-service.md) — RP1 Daemon Service via MSF Co-hosting
