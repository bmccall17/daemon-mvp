# ADR-012: Discord Bot — Daemon Assistant

**Status:** accepted (paused)
**Date:** 2026-03-11
**Deciders:** bam
**AI Context:** Claude Opus 4.6 / Claude Code

## Context
The daemon service REST API (`service/index.js`) exposes endpoints for daemon attachment (health, catalog, attach, detach, me). We want a Discord-native interface so users can interact with daemons without leaving their Discord server.

## Decision
Create a single-file Discord bot (`service/bot.js`) using discord.js v14 that maps 5 slash commands directly to the REST API via `fetch()`. No middleware framework (OpenClaw, etc.) — just discord.js wired to the local API.

- **User identity:** Discord user ID prefixed as `discord:<id>` passed as `userId` query param
- **Command registration:** Global slash commands auto-registered on bot startup
- **Daemon selection:** `/attach` uses a fixed choices list of all 8 daemon IDs
- **Responses:** Discord embeds for clean formatting
- **Config:** `service/.env` for bot token + API URL (gitignored)

## Consequences
- **Easier:** Discord users can attach/detach daemons with slash commands; no web UI needed
- **Easier:** Single file, no build step, shares `service/` directory with existing API
- **Harder:** Bot and API must run as separate processes
- **Harder:** Global slash commands take up to 1 hour to propagate on first registration

## Alternatives Considered
- **OpenClaw agent framework:** Rejected — unnecessary abstraction for 5 simple command-to-API mappings
- **Guild-scoped commands:** Would register instantly but limits bot to one server; chose global for flexibility
- **Embed bot in Express server:** Would simplify to one process but couples concerns; kept separate for independent scaling
