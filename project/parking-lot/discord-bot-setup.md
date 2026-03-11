# Discord Bot Setup — Parking Lot

**Status:** Paused
**Date parked:** 2026-03-11
**Reason:** Discord Developer Portal setup incomplete; no time to troubleshoot

---

## What's Done

- [x] `service/bot.js` — Discord bot code (5 slash commands wired to REST API)
- [x] `service/package.json` — `discord.js` + `dotenv` deps installed, `npm run bot` script
- [x] `service/.env` — bot token populated (gitignored)
- [x] REST API (`service/index.js`) works on `localhost:3002`

## What's NOT Done

- [ ] Verify bot token is valid and bot comes online
- [ ] Invite bot to a Discord server (OAuth2 URL flow)
- [ ] Confirm slash commands register and appear in Discord
- [ ] End-to-end test of all 5 commands

---

## Pickup Steps

### 1. Verify Discord Application Setup

1. Go to https://discord.com/developers/applications
2. Open your **Daemon Assistant** application
3. **Bot** tab:
   - Make sure a bot user exists (click "Add Bot" if not)
   - Enable **Message Content Intent** under Privileged Gateway Intents
   - Copy the bot token → paste into `service/.env` as `DISCORD_BOT_TOKEN=<token>`
4. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`
   - Copy the generated URL

### 2. Invite Bot to Server

1. Open the OAuth2 URL from step 1.4 in a browser
2. Select your Discord server → Authorize

### 3. Run Both Processes

Terminal 1:
```bash
cd ~/projects/daemon-mvp/service && npm run dev
```

Terminal 2 (separate tab):
```bash
cd ~/projects/daemon-mvp/service && npm run bot
```

Expected output in terminal 2:
```
Daemon Assistant online as DaemonAssistant#1234
Slash commands registered globally
```

### 4. Test in Discord

- Global slash commands can take **up to 1 hour** to appear the first time
- Type `/health` in any channel — should return a green embed with status "ok"
- Then try `/catalog`, `/attach wisp`, `/me`, `/detach`

### 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Missing DISCORD_BOT_TOKEN" on startup | Check `service/.env` has the token |
| Bot starts but no slash commands appear | Wait up to 1 hour (global registration delay) |
| "Used disallowed intents" error | Enable intents in Developer Portal → Bot tab |
| Commands appear but return errors | Make sure the REST API is running on port 3002 |
| "Invalid token" error | Reset token in Developer Portal → Bot → Reset Token |

---

## Files

| File | Purpose |
|------|---------|
| `service/bot.js` | Discord bot (slash commands → REST API) |
| `service/.env` | Bot token + API URL (gitignored) |
| `service/package.json` | Dependencies + `npm run bot` script |
| `service/index.js` | REST API server (already existed) |
| `service/daemon-routes.js` | API route definitions (already existed) |
