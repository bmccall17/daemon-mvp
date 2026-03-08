# ADR-003: Daemon Serialization Format

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett, Claude
**AI Context:** Claude Code CLI with Opus 4.6

## Context
To sync daemon state over MSF or any network layer, we need a clean serializable representation of daemon state. The daemon has: form identity, social state, topics, and position.

## Decision
Added `toSerializable()` to `Daemon` class returning:
```typescript
{
  formId: FormId,        // 'wisp' | 'ember' | ... | 'sigil'
  socialState: SocialState,  // 'OPEN' | 'SEEKING' | ...
  topics: TopicId[],     // string array
  position: { x, y, z }  // world position
}
```

This maps directly to MSF object properties for publish/subscribe. Topics are JSON-stringified for MSF storage (flat string property).

## Consequences
- **Easier:** Network layer just calls `toSerializable()` and publishes — no manual field mapping
- **Easier:** Peer reconstruction from `PeerState` is straightforward
- **Trade-off:** Position is the daemon group position (floating above avatar), not the avatar position. The MSF bridge uses avatar position for publishing and reconstructs daemon follow behavior on the receiving end.

## Alternatives Considered
1. **Serialize full Three.js state** — Way too heavy, unnecessary
2. **Protobuf/binary format** — Overkill for hackathon; MSF uses JSON properties anyway
