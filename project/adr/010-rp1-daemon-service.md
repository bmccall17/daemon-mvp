# ADR-010: RP1 Daemon Service — REST API via MSF Co-hosting

**Status:** accepted
**Date:** 2026-03-08
**Deciders:** bam, claude
**AI Context:** Claude Opus 4.6 via Claude Code CLI

## Context

The `daemons` service (RP1 service ID 20) needs a REST API that RP1 can reach over HTTPS. The team011 server only exposes port 443 via nginx, which reverse-proxies to the MSF Map Service on port 3011. We cannot modify nginx (no sudo) and non-standard ports are firewalled.

## Decision

Co-host the daemon REST routes inside the MSF Map Service's Express app rather than running a standalone server.

- Created `daemon-routes.js` as a self-contained Express router module
- Added `require('./daemon-routes').mount(pApp)` to MSF's `mapbase.js`
- Routes mounted at `/daemons/*` (health, catalog, me, attach, detach, update)
- All requests logged with full headers/body for RP1 contract discovery
- Added `LnG_Open` call in `rp1.js` for front-end service binding
- Deployed `mvconfig.json` to MSF web directory for back-end service broker config

Endpoints live at `https://team011.hackathon.rp1.dev/daemons/*`.

## Consequences

**Easier:**
- Service is reachable over HTTPS without infrastructure changes
- Single process to manage (MSF + daemons together)
- Shares SSL certs, CORS config, and Express middleware

**Harder:**
- Daemon service lifecycle tied to MSF service (restart one = restart both)
- Must avoid route collisions with MSF routes
- Vendor file (`mapbase.js`) modified — need to re-apply after MSF updates

## Alternatives Considered

1. **Standalone Express on port 3002** — worked locally but port firewalled externally
2. **Standalone on port 3001** — port already in use by another process
3. **Modify nginx config** — no sudo access on shared hackathon server
4. **Run on port 3011 instead of MSF** — would break the MSF Map Service
