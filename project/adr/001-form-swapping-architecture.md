# ADR-001: Form Swapping Architecture

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett, Claude

## Context
The daemon has 8 procedural form definitions in `form-selector.ts`, each with a `build()` function that creates Three.js objects. The original `Daemon` class had hardcoded visuals (particles, core mesh, glow). Form selection existed in the UI but was wired to a `console.log` TODO.

We needed form swapping to work live — click a form card, daemon changes visually — without memory leaks from undisposed geometry/materials.

## Decision
- Changed `DaemonFormDef.build()` signature from `THREE.Scene` to `THREE.Object3D` so forms can build into a `THREE.Group` (not just the root scene)
- Added a `formGroup` inside `Daemon.group` that holds the current form's visuals, separate from the beacon
- `setForm(formId)` disposes all children of `formGroup` (geometry + material), then calls the new form's `build()` into it
- Each form's `update(t, dt)` function is stored and called in `Daemon.update()`
- Default form is `wisp` (set in constructor)

## Consequences
- **Easier:** Adding new forms only requires adding to the `FORMS` array — no Daemon changes needed
- **Easier:** Serialization/networking — `formId` is a simple string to transmit
- **Trade-off:** Form procedural animations are independent of social state visuals (color lerping, particle spread). The beacon still responds to state, but form animations run their own logic. This is acceptable for the hackathon; a deeper integration could pipe state parameters into form update functions later.
- **Risk mitigated:** Explicit `geometry.dispose()` + `material.dispose()` prevents WebGL memory leaks on rapid form swapping

## Alternatives Considered
1. **Modify each form's build() to accept state params** — Too invasive for 8 forms during a hackathon. Deferred.
2. **Keep hardcoded Daemon visuals, overlay form on top** — Visually confusing, two particle systems fighting.
3. **Rebuild Daemon class per form** — Would break resonance/beacon/state systems. Too much coupling.
