 DaemonxOpenMetaverseHackathonIntegrationPlan.md

 Context

 Daemon-mvp is a spatial AI companion system (~1400 lines, Vite + TypeScript + Three.js) with 8 procedural daemon
 forms, 5 social states, topic-based resonance, and simulated multiplayer. It's compelling but isolated — peers are
  AI bots, form swapping is a TODO, and there's no connection to shared metaverse infrastructure.

 The 1st Annual Open Metaverse Hackathon (March 7-8, 2026) provides the tools to make daemon live in a shared
 world: ManifolderMCP (AI scene editing), ManifolderClient (browser fabric connection), and the MSF spatial fabric
 stack.

 Current blocker: The RP1 hackathon signup portal (signup.hackathon.rp1.dev) is not resolving. SSH keys are ready,
 but we cannot complete signup to get fabric server credentials. The hackathon setup requires: generate SSH key ->
 sign up at portal -> get provisioned server with fabricUrl + adminKey.

 Strategy: Build everything we can without the fabric server first (Phases 1-2). Architect the MSF bridge layer so
 it plugs in the moment credentials become available (Phase 3). If the portal comes back, we connect and go live.
 If not, we have a polished standalone demo + integration code ready to wire.

 Frameworks: GOTCHA (6-layer architecture) for project structure. ATLAS (5-step workflow) for build execution.

 ---
 GOTCHA Layer Map

 ┌───────────────┬───────────────────────────────────────────────────────────────────────────────┐
 │     Layer     │                             Role in This Project                              │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────────┤
 │ Goals         │ 5 goals prioritized by dependency (G1-G5)                                     │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────────┤
 │ Orchestration │ Claude + ManifolderMCP (28 tools for AI-driven scene editing, when available) │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────────┤
 │ Tools         │ ManifolderClient (browser SDK), Vite, existing daemon systems                 │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────────┤
 │ Context       │ MSF object hierarchy, STORYBOARD.md, hackathon tool docs                      │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────────┤
 │ Hard Prompts  │ MCP commands for scene setup (create daemon objects, query peers)             │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────────┤
 │ Args          │ MSF_CONFIG — fabricUrl, adminKey, sync rates, timeouts                        │
 └───────────────┴───────────────────────────────────────────────────────────────────────────────┘

 Goals (Priority Order)

 ┌─────┬──────────────────────────────────────────────┬────────────────────────────────┬──────────────────────┐
 │ ID  │                     Goal                     │           Depends On           │        Status        │
 ├─────┼──────────────────────────────────────────────┼────────────────────────────────┼──────────────────────┤
 │ G1  │ Complete form swapping                       │ Nothing (independent)          │ Ready to build       │
 ├─────┼──────────────────────────────────────────────┼────────────────────────────────┼──────────────────────┤
 │ G2  │ Daemon serialization + MSF bridge            │ G1                             │ Ready to build       │
 │     │ architecture                                 │                                │                      │
 ├─────┼──────────────────────────────────────────────┼────────────────────────────────┼──────────────────────┤
 │ G3  │ Connect daemon to shared MSF fabric          │ G2 + fabric credentials        │ BLOCKED (portal      │
 │     │                                              │                                │ down)                │
 ├─────┼──────────────────────────────────────────────┼────────────────────────────────┼──────────────────────┤
 │ G4  │ Replace simulated peers with real MSF peers  │ G3                             │ BLOCKED              │
 ├─────┼──────────────────────────────────────────────┼────────────────────────────────┼──────────────────────┤
 │ G5  │ Demo-ready hackathon experience              │ G1 + (G4 or simulated          │ Ready after G1       │
 │     │                                              │ fallback)                      │                      │
 └─────┴──────────────────────────────────────────────┴────────────────────────────────┴──────────────────────┘

 ---
 ATLAS Workflow

 A — ARCHITECT

 Problem: Daemon is a single-player demo with a broken form selector and simulated peers. For the hackathon, it
 needs (a) working form swapping, (b) a clean architecture ready for the Open Metaverse, and (c) live MSF
 integration if/when credentials become available.

 Users: The player (you), other hackathon participants, hackathon judges.

 Success looks like (Tier 1 — no fabric): All 8 daemon forms swap live, polished demo with simulated peers, MSF
 bridge code ready to plug in. Judges see the vision + the integration architecture.

 Success looks like (Tier 2 — with fabric): All of Tier 1 + daemon appears in shared MSF scene, two browsers see
 each other's daemons, resonance arcs form between real participants.

 Constraints:
 - 2-day hackathon (started today, March 7)
 - RP1 signup portal (signup.hackathon.rp1.dev) currently down — SSH keys ready, waiting for portal
 - Three.js version gap: Scene Assembler v0.128 vs daemon v0.183 (avoid mixing render code)
 - Build independent work first, MSF integration when unblocked

 ---
 T — TRACE

 Data Schema: Daemon as MSF Object

 // Daemon state mapped to MSF RMPObject properties
 interface DaemonMSFObject {
   objectId: string;        // MSF-assigned
   scopeId: string;         // scene scope
   displayName: string;     // "Brett", "Explorer 1"
   formId: string;          // 'wisp' | 'ember' | 'tide' | 'lattice' | 'murmur' | 'phantom' | 'pulse' | 'sigil'
   socialState: string;     // 'OPEN' | 'SEEKING' | 'FOCUSED' | 'BROWSING' | 'BROADCASTING'
   topics: string;          // JSON array of TopicIds
   posX: number;
   posY: number;
   posZ: number;
   lastUpdate: number;      // epoch ms for peer timeout
 }

 Integrations Map

 ┌─────────────────────┬────────────────┬────────────────────────────┬────────────────────────────────────────┐
 │       Service       │    Purpose     │            Auth            │             How We Use It              │
 ├─────────────────────┼────────────────┼────────────────────────────┼────────────────────────────────────────┤
 │ MSF Fabric Server   │ Shared spatial │ fabricUrl + adminKey       │ ManifolderClient connects from browser │
 │                     │  DB            │                            │                                        │
 ├─────────────────────┼────────────────┼────────────────────────────┼────────────────────────────────────────┤
 │ ManifolderMCP       │ AI scene       │ Same credentials via       │ Claude creates/queries scene objects   │
 │                     │ editing        │ config.json                │                                        │
 ├─────────────────────┼────────────────┼────────────────────────────┼────────────────────────────────────────┤
 │ ManifolderClient    │ Browser JS SDK │ Bundled with MVMF vendor   │ Imported into daemon-mvp for           │
 │                     │                │ libs                       │ publish/subscribe                      │
 ├─────────────────────┼────────────────┼────────────────────────────┼────────────────────────────────────────┤
 │ Manifolder          │ Read-only 3D   │ Public URL                 │ Judges verify daemons appear in shared │
 │ Visualizer          │ view           │                            │  world                                 │
 └─────────────────────┴────────────────┴────────────────────────────┴────────────────────────────────────────┘

 Stack

 - Keep: Vite 7.3, TypeScript 5.9, Three.js 0.183 (no changes)
 - Add: ManifolderClient (npm or vendor script tags)
 - Add: New module src/msf-bridge.ts (abstraction layer)
 - Add: New module src/config-ui.ts (fabric URL/key input)
 - Modify: src/daemon.ts, src/main.ts, src/peers.ts
 - Tool: ManifolderMCP registered as Claude MCP server

 Edge Cases

 - Fabric server unreachable -> fall back to simulated peers
 - Connection drops mid-session -> peers freeze, then timeout after 10s
 - Rapid state spam -> throttle publishes (100ms position, 500ms state)
 - Old meshes not disposed on form swap -> explicit geometry/material disposal
 - ManifolderClient vendor libs conflict with Vite -> load via dynamic script tags before app init

 ---
 L — LINK (Validate Before Building)

 Independent (validate now):
 [ ] L1: Form selector exports are usable by Daemon class (FORMS array, build() signatures)
 [ ] L2: Vite dev server runs clean (npm run dev)
 [ ] L3: Existing daemon/avatar/resonance systems stable baseline

 MSF-dependent (validate when portal comes back):
 [ ] L4: signup.hackathon.rp1.dev resolves — complete SSH key signup
 [ ] L5: fabricUrl reachable from browser
 [ ] L6: adminKey valid (connectRoot succeeds)
 [ ] L7: ManifolderMCP installed (clone, npm install, npm run build)
 [ ] L8: ManifolderMCP registered (claude mcp add --scope user manifolder)
 [ ] L9: ManifolderClient importable in browser
 [ ] L10: Can create/list objects via MCP tools

 Strategy: Complete L1-L3 immediately. Periodically retry signup.hackathon.rp1.dev. When it resolves, complete
 L4-L10 and unlock Phase 3.

 ---
 A — ASSEMBLE

 Phase 1: Form Swapping (NO dependencies, build NOW) — ~2 hours

 Files to modify:

 1. src/daemon.ts — Add setForm(formId) method:
   - Store formId property (default: 'wisp')
   - Clear existing meshes from this.group (dispose geometry + material)
   - Call the matching form's build() function from form-selector.ts
   - Wire returned update function into Daemon.update()
   - Add toSerializable() -> { formId, socialState, topics, position }
 2. src/main.ts (line ~49) — Wire form selector callback:
   - Change console.log TODO to playerDaemon.setForm(formId)
 3. src/form-selector.ts — Already exports FORMS array and FormId type. May need to refactor build() signatures to
 accept a THREE.Group instead of THREE.Scene.

 Verify: Click each of 8 forms in drawer -> daemon visually changes above player avatar.

 Phase 2: Daemon Serialization + Polish (NO dependencies, build NOW) — ~1 hour

 Files to modify:

 1. src/daemon.ts — Add serialization:
   - toSerializable() -> { formId, socialState, topics, position }
   - Static fromSerializable(data) factory for peer reconstruction
 2. src/types.ts — Add interfaces for MSF integration:
   - MSFConfig interface (fabricUrl, adminKey, syncRates, sceneId)
   - Extend PeerState with formId field
 3. Polish pass — Improve simulated peer behavior:
   - Simulated peers randomly pick forms (visual variety)
   - Better wander patterns to demo resonance more reliably

 Verify: playerDaemon.toSerializable() returns clean JSON. Simulated peers show form variety.

 Phase 3: MSF Bridge Architecture (build code NOW, connect WHEN portal is up) — ~2 hours

 New file: src/msf-bridge.ts

 export class MSFBridge {
   private client: any;
   private playerObjectId: string | null;
   private peerCache: Map<string, PeerState>;

   constructor(config: MSFConfig) {}
   async connect(): Promise<boolean> {}           // connectRoot + open scene
   async publishPlayer(state): Promise<void> {}   // create or update player object
   async fetchPeers(): Promise<PeerState[]> {}    // list objects, filter for daemons
   disconnect(): void {}                           // cleanup
 }

 New file: src/config-ui.ts
 - Simple overlay on load: "Fabric URL" + "Admin Key" + "Connect" button
 - Stores to localStorage for persistence
 - "Skip" button falls back to simulated mode (default when no credentials)

 Modify: src/peers.ts — Dual-mode PeerManager:

 export class PeerManager {
   private mode: 'simulated' | 'msf';
   private msfBridge?: MSFBridge;

   connectToMSF(bridge: MSFBridge): void {
     this.mode = 'msf';
     this.msfBridge = bridge;
     // clear simulated peers
   }

   update(dt, playerPos) {
     if (this.mode === 'msf') {
       // poll bridge.fetchPeers()
       // create/update/remove peer avatars + daemons
     } else {
       // existing simulated behavior
     }
   }
 }

 Modify: src/main.ts
 - After scene setup, show config UI
 - On connect: msfBridge.connect() -> peerManager.connectToMSF(bridge)
 - On skip/fail: peerManager.spawnSimulatedPeers(5) (existing behavior, works today)
 - In animate loop: msfBridge.publishPlayer(...) throttled to config rates

 Verify (without fabric): App loads, config overlay shows, "Skip" falls back to simulated peers. All existing
 functionality preserved.

 Verify (with fabric, when available): Console confirms connection. Manifolder visualizer shows daemon. Two tabs
 see each other.

 Phase 4: ManifolderMCP Setup (WHEN portal is up) — ~1 hour

 git clone https://github.com/PatchedReality/ManifolderMCP
 cd ManifolderMCP && npm install && npm run build

 # Configure with credentials from signup.hackathon.rp1.dev
 mkdir -p ~/.config/manifolder-mcp
 # config.json with fabricUrl + adminKey from portal

 # Register with Claude Code
 claude mcp add --scope user manifolder -- node $(pwd)/dist/index.js

 Verify: Use ManifolderMCP tools — list_scenes, create_scene("daemon-social-space"), create_object.

 Phase 5: Deploy + Demo Prep — ~1 hour

 - Build + deploy: npm run build -> push to GitHub Pages
 - Connection status indicator (green/yellow/red dot in UI)
 - Test on mobile browser (existing touch controls)
 - Demo flow: load URL -> pick form -> change state -> show resonance -> (connect to fabric if available)

 ---
 S — STRESS-TEST

 Tier 1 tests (no fabric required):

 ┌─────────────────────────┬──────────────────────────────────────┬────────────────────────────────────────────┐
 │          Test           │                Method                │               Pass Criteria                │
 ├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────────┤
 │ Form swap all 8 forms   │ Click each form card                 │ Visual changes, no console errors, no      │
 │                         │                                      │ memory leak                                │
 ├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────────┤
 │ Form swap during        │ Change form while resonating with    │ Resonance persists through form change     │
 │ resonance               │ sim peer                             │                                            │
 ├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────────┤
 │ State + topic changes   │ Click all states, toggle topics      │ Daemon visuals update, beacon shows/hides  │
 ├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────────┤
 │ Rapid state changes     │ Spam buttons                         │ No error flood, stable frame rate          │
 ├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────────┤
 │ Mobile browser          │ Open on phone                        │ Touch controls + daemon + UI all work      │
 ├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────────┤
 │ Config UI skip flow     │ Load app, click "Skip"               │ Falls back to simulated peers seamlessly   │
 └─────────────────────────┴──────────────────────────────────────┴────────────────────────────────────────────┘

 Tier 2 tests (with fabric, when available):

 ┌─────────────────────────┬──────────────────────────────────────────────┬────────────────────────────────────┐
 │          Test           │                    Method                    │           Pass Criteria            │
 ├─────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ MSF connect/disconnect  │ Toggle network                               │ Graceful fallback to simulated     │
 │                         │                                              │ peers                              │
 ├─────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ Two-player sync         │ Two browser tabs                             │ See each other within 1s,          │
 │                         │                                              │ positions smooth                   │
 ├─────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ State propagation       │ Change social state + topics                 │ Other tab sees change within 1s    │
 ├─────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ Resonance with real     │ Both select overlapping topics, walk close   │ Energy arcs form between real peer │
 │ peers                   │                                              │  daemons                           │
 ├─────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ Manifolder visibility   │ Open patchedreality.com/manifolder with      │ Daemon objects visible in          │
 │                         │ scene URL                                    │ hierarchy                          │
 └─────────────────────────┴──────────────────────────────────────────────┴────────────────────────────────────┘

 ---
 Execution Timeline

 Day 1 — March 7 (Today)

 ┌───────┬────────┬───────────────────────────────────────┬────────────────────────────────────────┬──────────┐
 │ Block │ Phase  │               Activity                │              Deliverable               │ Blocked? │
 ├───────┼────────┼───────────────────────────────────────┼────────────────────────────────────────┼──────────┤
 │ 1     │ Phase  │ Form swapping                         │ All 8 forms work live                  │ NO       │
 │ (2h)  │ 1      │                                       │                                        │          │
 ├───────┼────────┼───────────────────────────────────────┼────────────────────────────────────────┼──────────┤
 │ 2     │ Phase  │ Serialization + polish                │ toSerializable(), sim peer forms       │ NO       │
 │ (1h)  │ 2      │                                       │                                        │          │
 ├───────┼────────┼───────────────────────────────────────┼────────────────────────────────────────┼──────────┤
 │ 3     │ Phase  │ MSF bridge + config UI + dual-mode    │ Architecture complete, skip fallback   │ NO       │
 │ (2h)  │ 3      │ peers                                 │ works                                  │          │
 ├───────┼────────┼───────────────────────────────────────┼────────────────────────────────────────┼──────────┤
 │ --    │ Check  │ Retry signup.hackathon.rp1.dev        │ Get fabricUrl + adminKey               │ WAITING  │
 └───────┴────────┴───────────────────────────────────────┴────────────────────────────────────────┴──────────┘

 Day 2 — March 8

 ┌────────┬─────────────┬──────────────────────────────────────┬───────────────────────────┬─────────────┐
 │ Block  │    Phase    │               Activity               │        Deliverable        │  Blocked?   │
 ├────────┼─────────────┼──────────────────────────────────────┼───────────────────────────┼─────────────┤
 │ 4 (1h) │ Phase 4     │ ManifolderMCP setup (if portal up)   │ MCP tools available       │ CONDITIONAL │
 ├────────┼─────────────┼──────────────────────────────────────┼───────────────────────────┼─────────────┤
 │ 5 (1h) │ Phase 5     │ Deploy + demo prep                   │ Live URL, demo-ready      │ NO          │
 ├────────┼─────────────┼──────────────────────────────────────┼───────────────────────────┼─────────────┤
 │ 6 (1h) │ Stress-test │ Tier 1 tests (+ Tier 2 if connected) │ All applicable tests pass │ NO          │
 └────────┴─────────────┴──────────────────────────────────────┴───────────────────────────┴─────────────┘

 If portal never comes back: We ship a polished Tier 1 demo (form swapping, simulated resonance, MSF bridge code
 visible as integration proof). The bridge architecture demonstrates we're "one config away" from live multiplayer.

 ---
 Risk Mitigation

 ┌───────────────────────────────────┬─────────────────────────────────────────────────────────────────────────┐
 │               Risk                │                               Mitigation                                │
 ├───────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
 │ RP1 signup portal stays down      │ Ship Tier 1 demo + MSF bridge as "ready to connect" proof               │
 ├───────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
 │ ManifolderClient conflicts with   │ Load vendor scripts via dynamic <script> tags before app init           │
 │ Vite                              │                                                                         │
 ├───────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
 │ Three.js version conflict         │ NEVER import Scene Assembler render code; only use ManifolderClient     │
 │                                   │ data layer                                                              │
 ├───────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
 │ Form swap memory leak             │ Explicit geometry.dispose() + material.dispose() on all old meshes      │
 ├───────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
 │ Fabric server slow/rate-limited   │ Throttle: 10Hz position, 2Hz state updates                              │
 └───────────────────────────────────┴─────────────────────────────────────────────────────────────────────────┘

 ---
 Critical Files

 ┌───────────────────────┬──────────────────────────────────────────────────────────────┐
 │         File          │                           Changes                            │
 ├───────────────────────┼──────────────────────────────────────────────────────────────┤
 │ src/daemon.ts         │ Add setForm(), formId property, toSerializable()             │
 ├───────────────────────┼──────────────────────────────────────────────────────────────┤
 │ src/main.ts           │ Wire form callback, MSF bridge init, publish in animate loop │
 ├───────────────────────┼──────────────────────────────────────────────────────────────┤
 │ src/peers.ts          │ Dual-mode: simulated vs MSF-backed peers                     │
 ├───────────────────────┼──────────────────────────────────────────────────────────────┤
 │ src/form-selector.ts  │ May refactor build() to accept Group instead of Scene        │
 ├───────────────────────┼──────────────────────────────────────────────────────────────┤
 │ src/types.ts          │ Add MSFConfig interface, extend PeerState with formId        │
 ├───────────────────────┼──────────────────────────────────────────────────────────────┤
 │ NEW src/msf-bridge.ts │ Abstraction layer: connect, publish, fetch peers             │
 ├───────────────────────┼──────────────────────────────────────────────────────────────┤
 │ NEW src/config-ui.ts  │ Fabric URL/key input overlay                                 │
 └───────────────────────┴──────────────────────────────────────────────────────────────┘

 Reusable Existing Code

 - form-selector.ts:FORMS array + build() functions — reuse directly in Daemon.setForm()
 - types.ts:PeerState interface (lines 87-93) — extend for MSF peer data
 - types.ts:TOPIC_VECTORS — reuse for resonance with real MSF peers
 - resonance.ts — works unchanged with real peers (just needs valid DaemonEntry objects)
 - peers.ts:PeerManager — refactor, don't rewrite; keep simulated mode as fallback