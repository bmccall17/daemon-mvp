# ADR-004: GOTCHA + ATLAS Framework for Project Structure

**Status:** accepted
**Date:** 2026-03-07
**Deciders:** Brett
**AI Context:** Claude Code CLI with Opus 4.6

## Context
The hackathon integration plan needed a structured approach to manage goals, dependencies, blockers, and phased execution across a 2-day timeline with an external dependency (MSF portal) that might never resolve.

## Decision
Adopted two frameworks:
- **GOTCHA** (Goals, Orchestration, Tools, Context, Hard Prompts, Args) for 6-layer project architecture
- **ATLAS** (Architect, Trace, Link, Assemble, Stress-test) for build execution workflow

Five goals (G1-G5) prioritized by dependency. Phases 1-3 buildable without fabric; Phases 4-5 conditional on portal availability. Tier 1 (standalone) vs Tier 2 (connected) success criteria.

## Consequences
- **Easier:** Clear priority ordering — build independent work first, connect later
- **Easier:** Two-tier success criteria means we ship something valuable regardless of blockers
- **Trade-off:** Framework overhead for a 2-day hackathon. Justified by the blocked dependency requiring careful planning.

## Alternatives Considered
1. **Ad-hoc build** — Risk of wasting time on blocked paths
2. **Wait and see** — Loses build time while portal is down
