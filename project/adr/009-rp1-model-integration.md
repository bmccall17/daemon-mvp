# ADR-009: RP1 Model Integration & Material Conversion

**Status:** accepted
**Date:** 2026-03-08
**Deciders:** Brett, Gemini
**AI Context:** Antigravity on Gemini 3.1 Pro (High)

## Context
After successfully syncing player movements and data to the MSF fabric, the next major hurdle was visualizing our procedural Daemons inside an actual RP1 client environment. 

During our initial tests, the Scene Assembler could not locate or update the objects, and the `.glb` exports generated from our runtime web app lacked the vibrant glowing effects from our Three.js shaders, looking flat and dark. Additionally, the spawn positioning embedded the Daemons directly into the floor geometry of the host level.

## Decision
Using the Antigravity (Gemini) agent, we made several architectural changes to accommodate the RP1 Scene Assembler and GLTF standards:

1. **Scene Assembler JSON Injection:**
   We bypassed the runtime `createObject` limitations by directly providing a compiled JSON array payload into the Scene Assembler's Code Editor. This explicitly established all 8 Daemon forms (`daemon-ember`, `daemon-lattice`, etc.) as permanent objects in the space without fighting the database's `twObjectIx` IDs.
   
2. **Coordinate Offset (Jordan College, Oxford):**
   The base `Y` axes were adjusted to `10.0` to hoist the Daemons into the clear air, avoiding collisions with the established building geometry of the RP1 level (mapped playfully to Jordan College in Oxford, UK).

3. **Material Downgrade/Upgrade:**
   We refactored `form-selector.ts` to replace all instance of `MeshBasicMaterial` and `ShaderMaterial` with engine-agnostic `MeshStandardMaterial`s. To preserve our glowing aesthetic, we drove the color data into the `emissive` channels with high `emissiveIntensity`, ensuring the RP1 PBR lighting engine treats them as intrinsic light sources.

4. **Extended Export Bake Times:**
   The `GLTFExporter` logic in `main.ts` was tweaked to allow 150 frames of animation to run (up from 60) before taking the snapshot, giving the procedural Daemons time to "expand" into their full state before freezing into static `.glb` files.

## Consequences
**Easier:** 
- The Daemons now reliably render natively in the Scene Assembler.
- The `.glb` files correctly interpret emissive colors without needing custom shader injection on the RP1 side.

**More difficult:** 
- We forfeit runtime particle physics (`THREE.Points`) and additive blending techniques, as those do not easily bake into standard GLTF meshes. Those forms must be captured as static meshes in their expanded states.
