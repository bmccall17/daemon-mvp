# OpenClaw Setup Plan for daemon-mvp

## Context
The daemon-mvp project (RP1 Open Metaverse Hackathon) has a working spatial AI companion with 8 forms, MSF fabric integration, and a live REST API. We want to add OpenClaw as an orchestration layer to: scrape 3D assets, expose the daemon service via Discord chat, and explore further automations.

OpenClaw is an open-source self-hosted AI agent framework (npm, Node >= 22) that runs as a persistent daemon with 50+ integrations.

---

## Phase 1: Install & Configure (~10 min)

1. **Install globally:** `npm install -g openclaw@latest`
2. **Run onboarding:** `openclaw onboard --install-daemon`
   - Choose DeepSeek as primary model provider (cheap orchestrator)
   - Store DeepSeek API key in `~/.openclaw/.env` as `DEEPSEEK_API_KEY`
   - Also store `ANTHROPIC_API_KEY` for Claude Code handoff
   - If WSL2 lacks systemd, skip `--install-daemon` and run gateway in tmux instead
3. **Set workspace + two-tier model config** in `~/.openclaw/openclaw.json`:
   ```json5
   {
     agents: {
       defaults: {
         workspace: "/home/bam/projects/daemon-mvp",
         model: { primary: "deepseek/deepseek-chat" }  // cheap for orchestration
       }
     }
   }
   ```
4. **Enable web tools:** set `tools.profile: "full"` in config
5. **Verify:** `openclaw gateway status` + open `http://127.0.0.1:18789/`

### Two-Tier Model Strategy
```
User (Discord) → OpenClaw (DeepSeek - cheap) → Claude Code (Opus/Sonnet - quality)
                  orchestration, chat, scraping    actual code writing & debugging
```
- **OpenClaw runs DeepSeek/Qwen** (~$0.14-0.27/M tokens) for routine tasks: parsing messages, running cron checks, calling APIs, formatting responses
- **Claude Code is invoked only when code needs to be built** — OpenClaw skills shell out to `claude` CLI for engineering tasks
- **Result:** Claude-quality code output, but 10-50x cheaper for the orchestration layer that runs 24/7
- DeepSeek API: https://platform.deepseek.com/ (or Qwen via https://dashscope.aliyuncs.com/)

## Phase 2: Discord Bot (~15 min)

1. Create bot at https://discord.com/developers/applications ("Daemon Assistant")
2. Enable Message Content Intent + Server Members Intent
3. Generate invite URL (scopes: bot, applications.commands) and add to server
4. Store token in `~/.openclaw/.env` as `DISCORD_BOT_TOKEN`
5. Configure in `openclaw.json`:
   ```json5
   { channels: { discord: { enabled: true, token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" } } } }
   ```
6. Restart gateway, approve pairing via `openclaw pairing approve discord <CODE>`
7. **Test:** DM the bot "hello"

## Phase 3: Asset Scraping Skill (~10 min)

Create `~/.openclaw/skills/asset-scraper/SKILL.md`:
- Searches Sketchfab, Poly Haven, Kenney.nl, OpenGameArt for free GLB/GLTF models
- Filters by CC0/CC-BY license, low-poly/stylized aesthetic
- Maps finds to daemon archetypes (wisp, ember, tide, lattice, murmur, phantom, pulse, sigil)
- Reports URLs, license, poly count
- Never downloads without confirmation

Optional: set up Firecrawl for JS-heavy sites (free tier at firecrawl.dev)

## Phase 4: Daemon API Chat Skill (~10 min)

Create `~/.openclaw/skills/daemon-api/SKILL.md`:
- Wraps the live REST API at `https://team011.hackathon.rp1.dev/daemons/`
- Endpoints: health, catalog, me, attach, detach, update
- Lets teammates/judges DM the bot: "show daemon catalog", "check service health"
- Uses web_fetch to call endpoints and format results

## Phase 5: Cron & Automation (optional, ~5 min)

- One-shot asset hunt: `openclaw cron add --name "asset-hunt" --at <time> --message "Find 5 free GLB spirit/creature models" --announce --channel discord`
- Recurring build check: `openclaw cron add --name "build-watch" --cron "*/30 * * * *" --message "Check daemon service health at team011.hackathon.rp1.dev/daemons/health"`

---

## Key Files
- `~/.openclaw/openclaw.json` — main config (created by onboarding)
- `~/.openclaw/.env` — secrets (ANTHROPIC_API_KEY, DISCORD_BOT_TOKEN)
- `~/.openclaw/skills/asset-scraper/SKILL.md` — asset scraping skill
- `~/.openclaw/skills/daemon-api/SKILL.md` — daemon REST API skill
- `/home/bam/projects/daemon-mvp/src/form-selector.ts` — 8 form defs (reference for asset matching)
- `/home/bam/projects/daemon-mvp/service/daemon-routes.js` — REST endpoints the chat skill wraps

## Security
- All tokens in `~/.openclaw/.env`, never in git
- Gateway binds to loopback only (127.0.0.1)
- Discord DM policy: pairing mode (requires owner approval)
- OpenClaw lives entirely outside the repo (`~/.openclaw/`)
- DeepSeek/Qwen API keys are separate from Anthropic — lower blast radius if compromised

## Verification
| Check | Command |
|-------|---------|
| Gateway running | `openclaw gateway status` |
| Discord connected | DM bot "hello" |
| Skills loaded | `openclaw skills list` |
| Asset search | Ask bot "find free GLB creature models" |
| Daemon API | Ask bot "check daemon health" |
| Crons active | `openclaw cron list` |

## WSL2 Notes
- If systemd not enabled, run `openclaw gateway --port 18789` in tmux
- Control UI at `localhost:18789` should forward from WSL2 to Windows browser
- Separate ANTHROPIC_API_KEY needed (Claude Code may use different auth)
