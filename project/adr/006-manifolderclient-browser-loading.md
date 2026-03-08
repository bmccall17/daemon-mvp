# ADR-006: ManifolderClient Browser Loading Strategy

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett, Claude

## Context
The MSF Bridge needs ManifolderClient in the browser to connect to the fabric. ManifolderClient is an ESM module that depends on:
1. MVMF vendor scripts (jQuery, Socket.IO, MVMF/MVRP stack) loaded as globals
2. An internal `node-helpers.js` ESM import

Vite's build pipeline tries to bundle any `<script type="module">` in index.html, which conflicts with vendor scripts that must remain external.

## Decision
Three-layer loading strategy:
1. **Vendor globals** — 10 MVMF scripts loaded as regular `<script>` tags in index.html (jQuery, Socket.IO, MVMF, MVSB, MVXP, MVIO, MVRP, MVRest, MVRP_Dev, MVRP_Map). These initialize `globalThis.MV`.
2. **Runtime ESM injection** — `MSFBridge.connect()` dynamically creates a `<script type="module">` at runtime that imports `ManifolderClient.js` and assigns `createManifolderPromiseClient` to `window.__createManifolderPromiseClient`. This avoids Vite bundling entirely.
3. **Event coordination** — The injected script fires a `manifolder-ready` event; the bridge awaits it before proceeding.

All vendor files live in `public/vendor/` and are copied unchanged to `docs/vendor/` by Vite.

## Consequences
- **Fixed:** ManifolderClient loads correctly in both dev and production builds
- **Fixed:** Vite doesn't try to bundle vendor scripts or ESM module
- **Trade-off:** Runtime script injection is unconventional, but necessary given the vendor script dependency chain
- **Trade-off:** ~500KB of vendor scripts loaded on every page (acceptable for hackathon)

## Alternatives Considered
1. **Inline `<script type="module">` in index.html** — Vite/Rollup tries to bundle it, fails
2. **Dynamic `import()` in TypeScript** — `import.meta.url` resolves to bundled asset path, wrong base
3. **Bundle ManifolderClient with Vite** — Would need to shim all MVMF globals, too invasive
