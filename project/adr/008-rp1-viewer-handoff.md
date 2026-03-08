# ADR-008: Handoff to Claude Code CLI for RP1 Viewer Blocker

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett, Gemini
**AI Context:** Antigravity on Gemini 3.1 Pro (High)

## Context
During Phase 5 of the MVP development (Day 1 of the Open Metaverse Hackathon), the team successfully integrated the `ManifolderClient` with the Metaverse Spatial Fabric (MSF) `team011.hackathon.rp1.dev`. Object creation, peer synchronization, and web-client state management were all verified as working, resolving the initial ghosting and database serialization errors (see ADR-007).

However, the team encountered a hard blocker at the finish line: the `daemon-social-space` scene could not be visibly rendered because the expected RP1 native web viewer endpoint (`https://team011.hackathon.rp1.dev/web/`) was returning a 404 error. The hackathon documentation implies a viewer should be available, and without it, the team cannot verify if the `.glb` resource references are natively loading correctly in the RP1 Spatial Fabric.

Because the Antigravity (Gemini) agent operates best on bounded code generation and refactoring tasks within the existing repository workspace, it is not well-suited for external open-ended debugging and traversing/querying the web or reaching out to external dev teams for documentation that isn't already present in the codebase.

## Decision
We are intentionally pausing the Antigravity agent's continuous execution loop and handing the project context over to the **Claude Code CLI**.

Claude will be tasked with:
1. Ingesting `project/progress/rp1-integration-status.md` and the recent `/ship` workflow outputs.
2. Formulating the exact question or troubleshooting sequence needed to figure out how to access the `team011` viewer.
3. If necessary, drafting a communication to the RP1 dev team on Discord to resolve the 404 error.

## Consequences
**Easier:** Claude is explicitly invoked to handle the "unknown unknowns" of the third-party hackathon environment setup, separating the "building the code" phase (Gemini) from the "debugging the external environment" phase (Claude).

**More difficult:** The context handoff requires ensuring `STATUS.md`, `rp1-integration-status.md`, and this ADR accurately capture the precise state of the application so Claude does not hallucinate past the explicit 404 block.
