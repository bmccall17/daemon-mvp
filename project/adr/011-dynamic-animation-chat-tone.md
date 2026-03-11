# ADR-011: Dynamic Animation on Contact + Chat Tone Integration

**Status:** accepted
**Date:** 2026-03-11
**Deciders:** bam, Claude Opus 4.6
**AI Context:** Claude Opus 4.6 via Claude Code CLI

## Context

The daemon MVP had 8 procedural forms, topic-based resonance, and simulated multiplayer deployed to GitHub Pages. However, daemons did not visually react to proximity — `resonanceStrength` and `resonanceColor` were computed by `ResonanceSystem` but never consumed by form update closures. Additionally, there was no way for users to interact with their daemon beyond selecting topics and social states from UI controls. The demo needed more visual dynamism and a conversational input channel to maximize hackathon impact.

Separately, MSF fabric multiplayer had several blocking bugs: object names exceeded the database column limit (`Name_wsRMPObjectId`), `createObject` calls failed with `error -1` after ghost accumulation, and there was no visual distinction between NPC and real player avatars.

## Decision

### Phase 1: Dynamic Animation on Contact

**FormContext plumbing** — Added a `FormContext` interface to `form-selector.ts` carrying `resonanceStrength`, `resonanceColor`, `nearbyDirection`, `nearbyDistance`, and `excitementLevel`. All 8 form update closures now accept an optional `FormContext` parameter. `daemon.ts` builds the context each frame and passes it through. `resonance.ts` populates `nearbyDirection`/`nearbyDistance` in its pairwise loop.

**Form-specific reactions** — Each form reacts uniquely when `resonanceStrength > 0`:
- Wisp: particles drift toward neighbor
- Ember: sparks arc sideways, spawn rate increases
- Tide: ribbon amplitudes increase, lean toward neighbor
- Lattice: shells expand, rotation accelerates
- Murmur: swarm attractor shifts toward neighbor
- Phantom: eyes track neighbor, billowing intensifies
- Pulse: ring emission rate doubles, rings tilt
- Sigil: orbits widen, nearest glyphs glow

**Midpoint interaction particles** — New `InteractionFXSystem` (`interaction-fx.ts`) manages a pool of 6 pre-allocated particle systems activated at midpoints of resonance links exceeding 0.4 strength.

### Phase 2: Chat Tone Integration

**Client-side tone analyzer** (`tone-analyzer.ts`) — Keyword dictionaries + punctuation heuristics classify messages into 7 tones (curious, excited, supportive, argumentative, contemplative, playful, neutral) with intensity, valence, arousal, and topic hints. No external API needed (CORS blocks browser calls to Claude API from GitHub Pages).

**Tone reactor** (`tone-reactor.ts`) — Maps tone results to daemon behavior: state transitions (curious→SEEKING, excited→BROADCASTING), excitement level scaling animation speed, valence shifting color warm/cool.

**Thought bubbles** (`thought-bubble.ts`) — Canvas-rendered `THREE.Sprite` text reactions above the daemon ("hmm...", "YES!", "I see you"), fading out over 3 seconds.

**Chat UI** (`chat-ui.ts`) — Bottom-left panel with scrolling log and text input. Stops WASD propagation while focused. On Enter: `analyzeTone()` → `applyTone()` → `showThought()` → colored tone badge in log.

### MSF Fabric Fixes

**Compact name encoding** — Replaced verbose `daemon:SID:Name:form:OPEN:1773007023094:["spatial-computing","ai-agents"]` (~78 chars) with `d:SID:Name:form:O:ts36:01` (~34 chars) to fit within the MSF database's `Name_wsRMPObjectId` column limit. Social states compressed to single chars, timestamps to base36, topics to index digits.

**Publish failure handling** — After 5 consecutive `createObject` failures, publishing is disabled with a single log message instead of spamming errors every frame. Before creating new objects, attempts to reclaim stale ghost objects via `updateObject`.

**Player name labels** — Floating `THREE.Sprite` name labels above avatars: bright cyan with glow for real MSF players, dim grey for simulated NPCs. Player's own avatar labeled "You".

## Consequences

**Easier:**
- Daemons feel alive — proximity creates visible reactions unique to each form
- Users can "talk" to their daemon and see immediate visual feedback
- Real players are instantly distinguishable from NPCs
- MSF multiplayer is stable (no more name overflow crashes or publish spam)

**Harder:**
- FormContext adds a parameter to all form closures — new forms must handle it
- Compact name encoding is less human-readable in MSF debug logs
- Client-side tone analysis is heuristic-only — sophisticated messages may miscategorize

## Alternatives Considered

- **Claude API for tone analysis** — Rejected due to CORS blocking browser→API calls from GitHub Pages. Would require a proxy server.
- **WebSocket-based peer sync** — Rejected since MSF fabric already provides the transport layer.
- **Server-side name storage** — Rejected since MSF doesn't support custom properties on scene objects; name-encoding is the only available field.
- **HTML overlay labels** — Rejected in favor of THREE.Sprite labels that stay in 3D space and scale with distance.

## Files Modified
- `src/daemon.ts` — nearbyDirection, nearbyDistance, excitementLevel; FormContext pass-through
- `src/form-selector.ts` — FormContext interface; 8 form closure reactions
- `src/resonance.ts` — populate nearbyDirection/nearbyDistance in pairwise loop
- `src/peers.ts` — name labels on spawn; dual-mode always shows simulated peers
- `src/avatar.ts` — setNameLabel() with canvas-rendered sprite
- `src/msf-bridge.ts` — compact name encoding, publish failure handling, ghost reclaim
- `src/main.ts` — wire InteractionFX, ToneReactor, ThoughtBubbleSystem, ChatUI

## Files Created
- `src/interaction-fx.ts` — midpoint particle system pool
- `src/tone-analyzer.ts` — client-side keyword/heuristic tone classification
- `src/tone-reactor.ts` — tone→daemon behavior mapping
- `src/thought-bubble.ts` — floating text sprite system
- `src/chat-ui.ts` — chat input/log panel
