# ADR-007: MSF Ghost Object and Spawn Bug Fix

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett, Gemini
**AI Context:** Antigravity on Gemini 3.1 Pro (High)

## Context
When running in MSF mode, the `PeerManager` continuously fetched MSF objects at 2Hz. If `ManifolderClient.createObject()` timed out due to fabric connection latency during initialization, `MSFBridge.publishPlayer()` would continuously trigger `createObject()` at 10Hz without waiting for previous requests to complete. This created an infinite object spawn loop, polluting the Scene Assembler with hundreds of ghost daemon objects. 

Furthermore, `MSFBridge.fetchPeers()` unconditionally reported `lastUpdate: Date.now()` for all fetched peers, regardless of whether the actual player client was actively broadcasting. This prevented the 10-second timeout logic in `PeerManager` from cleanly destroying stale or ghost connections. Finally, local `PeerManager` rebuilt WebGL form geometry continuously for remote peers during updates.

## Decision
1. **Async lock**: Implemented `isPublishing` flag in `MSFBridge.publishPlayer()` to prevent duplicate in-flight `createObject` requests.
2. **Heartbeat timestamps**: Injected the client's `Date.now()` timestamp directly into the `name` property of published daemon objects (`daemon:name:form:state:timestamp:topics`).
3. **Timestamp culling**: Extracted the broadcasted timestamp in `fetchPeers()`. Objects with invalid, older (>10s), or missing timestamps are entirely ignored by the client bridge.
4. **Beforeunload hook**: Added a `window.addEventListener('beforeunload')` hook to tell the MSF backend to proactively delete the object on tab closure.
5. **SetForm guard**: Updated `PeerManager` to only call `daemon.setForm()` if `state.formId !== daemon.getFormId()`, preventing WebGL material rebuild flashing.

## Consequences
- **Fixed:** Massive reduction in fabric compute overhead and local memory use since ghost daemon objects are now instantly culled (and eventually trashed in Scene Assembler).
- **Fixed:** Peer flicker during updates eliminated.
- **Easier:** The strict heartbeat timestamp mechanism enforces synchronization even if MSF's backend socket connections drop unreliably.
