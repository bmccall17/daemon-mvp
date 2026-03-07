# ADR-002: MSF Bridge + Dual-Mode Peer System

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett, Claude

## Context
The hackathon requires connecting to the MSF spatial fabric for shared multiplayer, but the signup portal (`signup.hackathon.rp1.dev`) is down. We need to build everything we can without credentials and plug in when they become available.

The existing `PeerManager` only supports simulated (AI-driven) peers.

## Decision
- Created `MSFBridge` class (`src/msf-bridge.ts`) as an abstraction layer over ManifolderClient
  - `connect()` / `disconnect()` for lifecycle
  - `publishPlayer()` throttled at configurable rates (10Hz position, 2Hz state)
  - `fetchPeers()` returns `PeerState[]` from fabric objects
  - Gracefully no-ops when ManifolderClient isn't loaded
- Refactored `PeerManager` to dual-mode: `'simulated' | 'msf'`
  - `connectToMSF(bridge)` switches to MSF mode, removes sim peers
  - `disconnectMSF()` reverts to simulated mode
  - MSF mode polls peers at 2Hz, creates/removes peer avatars dynamically, times out stale peers at 10s
- Created `config-ui.ts` — startup overlay with Fabric URL/Key inputs
  - "Connect" attempts MSF, falls back to simulated on failure
  - "Solo Mode" skips directly to simulated peers
  - Credentials persist in localStorage

## Consequences
- **Easier:** One config away from live multiplayer — no code changes needed when portal comes up
- **Easier:** Solo mode works perfectly as a standalone demo for judges
- **Trade-off:** Config overlay adds a click before entering the experience. Acceptable for hackathon context.
- **Trade-off:** ManifolderClient loaded via `window` global (vendor script tag pattern) rather than npm import, to avoid Vite bundling conflicts with the vendor SDK

## Alternatives Considered
1. **Wait for portal, build everything at once** — Too risky; might never unblock
2. **Hardcode fabric URL in env vars** — Less flexible, no fallback UI
3. **WebSocket-based custom sync** — Reinventing what MSF provides; not aligned with hackathon tools
