# Daemon Storyboard: What Done Looks Like

> Each phase ends with a shippable moment. If the hackathon ended right now, this is what judges would see.

---

## Phase 0: Scaffold (FRIDAY NIGHT -- done)

### What you see:
```
+--------------------------------------------------+
|                                                  |
|          Dark space. Grid floor. Fog.            |
|          Floating dust particles drift.          |
|                                                  |
|              [ capsule avatar ]                  |
|                  (you)                           |
|                                                  |
|     [ peer ]        [ peer ]       [ peer ]     |
|                         [ peer ]                 |
|                                    [ peer ]      |
|                                                  |
|  -------- bottom bar: state buttons ----------- |
+--------------------------------------------------+
```

**User story:** *I open a URL. I see a dark atmospheric space with a grid floor. I move with WASD. There are other figures wandering around. That's it.*

**Judge reaction:** "Okay, it's a 3D scene. What's the point?"

---

## Phase 1: Foundation (SATURDAY 9am-12pm)

### What changes:
- Multiplayer is REAL. Two browser tabs = two avatars in the same space.
- Smooth position sync. No jitter.
- Simple name labels float above avatars.

### What you see:
```
+--------------------------------------------------+
|                                                  |
|          Same dark space, but now...             |
|                                                  |
|          "Brett"            "Explorer 2"         |
|        [ capsule ]         [ capsule ]           |
|                                                  |
|    "Alex"                                        |
|  [ capsule ]        "Sam"                        |
|                   [ capsule ]                    |
|                                                  |
+--------------------------------------------------+
```

**User story:** *I send the URL to a friend. They open it on their phone. I see their avatar appear and walk around. We're in the same space. It feels live.*

**Judge reaction:** "Multiplayer works. Still wondering what makes this special."

**Done means:**
- [ ] Two separate browsers see each other move in real-time
- [ ] Position sync feels smooth (no teleporting)
- [ ] Works on mobile browser

---

## Phase 2: Companion (SATURDAY 12pm-3pm)

### What changes:
- Every avatar now has a DAEMON -- a glowing particle cloud that floats beside them.
- Daemons breathe. They drift. They have micro-curiosity movements.
- Selecting a social state transforms the daemon's color, spread, pulse, and orbit.

### What you see:
```
+--------------------------------------------------+
|                                                  |
|         "Brett"                                  |
|        [ avatar ]                                |
|           *                                      |
|         ** ** **    <-- warm gold particles,     |
|          *****         expanded, bright           |
|           ***          (state: OPEN)             |
|                                                  |
|                          "Alex"                  |
|                        [ avatar ]                |
|                            .                     |
|                           ...   <-- tight purple |
|                            .       cluster, dim  |
|                                    (FOCUSED)     |
|                                                  |
|  [ Open ] [ Seeking ] [ Focused ] [ Browsing ]  |
+--------------------------------------------------+
```

**User story:** *A glowing companion appears beside me. It breathes. It drifts. It feels alive. I click "Seeking" and it transforms -- particles spread outward, color shifts to blue, pulse quickens. I look at Alex's avatar across the space and see their daemon is tight and purple. Without reading anything, I can tell: they're focused, don't interrupt.*

**Judge reaction:** "Oh. The companion IS the interface. I can read people at a glance."

**Done means:**
- [ ] Every avatar has a daemon that follows with spring physics (no jitter)
- [ ] 5 states produce visually distinct daemon forms
- [ ] State changes sync across all clients
- [ ] Idle daemon feels alive (breathing, drift, curiosity)
- [ ] A single user alone still feels accompanied

---

## Phase 3: Signal (SATURDAY 3pm-6pm)

### What changes:
- Players select 1-3 topics from a radial menu.
- Daemon projects a spinning beacon (octahedron) above the avatar.
- Beacon color matches topic. Visible from across the space.
- Multiple topics blend into a combined beacon color.

### What you see:
```
+--------------------------------------------------+
|                                                  |
|         /\          <-- beacon: "AI Agents"      |
|        /  \             cyan octahedron,         |
|        \  /             spinning, glowing        |
|         \/                                       |
|                                                  |
|        "Brett"           /\  <-- "Game Design"   |
|       [ avatar ]        /  \     orange          |
|         *****           \  /                     |
|          ***             \/                      |
|                        "Sam"                     |
|   /\                  [ avatar ]                 |
|  /  \ "Music"           ****                     |
|  \  /  pink                                      |
|   \/                                             |
|  "Alex"                                          |
| [ avatar ]                                       |
|    ...                                           |
|                                                  |
|  topics: [AI Agents] [Spatial] [Game Design]...  |
|  [ Open ] [ Seeking ] [ Focused ] [ Browsing ]   |
+--------------------------------------------------+
```

**User story:** *I select "AI Agents" and "Spatial Computing." A spinning cyan-violet beacon rises above my head. I look around the space and see beacons everywhere -- I can tell from across the room that Sam is into Game Design (orange) and Alex is broadcasting Music (pink). I don't need to walk over and inspect them. The space tells me who's who.*

**Judge reaction:** "This solves a real problem. I've been at conferences where I had no idea who to talk to. This makes it visible."

**Done means:**
- [ ] Topic selector works (pick 1-3 topics)
- [ ] Beacon appears above avatar, colored by topic
- [ ] Beacons visible at distance (scale with range)
- [ ] Topics sync across all clients
- [ ] Multiple topics blend into combined beacon color

---

## Phase 4: Resonance (SATURDAY 6pm-9pm)

### What changes:
- Walk near someone with matching topics. Your daemons react.
- Colors harmonize. Particles sparkle. Energy arcs bridge between you.
- Get THREE compatible people together and a MERGED BEACON forms above the group.
- This is the demo moment. This is what wins.

### What you see -- the approach:
```
+--------------------------------------------------+
|                                                  |
|   You're walking toward Sam. Both have           |
|   "AI Agents" selected.                         |
|                                                  |
|         /\                    /\                 |
|        /  \                  /  \                |
|        \  /                  \  /                |
|         \/                    \/                 |
|                                                  |
|       "Brett"              "Sam"                 |
|      [ avatar ]          [ avatar ]              |
|        *****               ****                  |
|         ***                 ***                  |
|                                                  |
|   (8 units apart -- no reaction yet)             |
|                                                  |
+--------------------------------------------------+
```

### What you see -- resonance triggers:
```
+--------------------------------------------------+
|                                                  |
|   You walk closer. Within range. Daemons react.  |
|                                                  |
|         /\                /\                     |
|        /  \              /  \                    |
|        \  /              \  /                    |
|         \/                \/                     |
|                                                  |
|       "Brett"    ~~~~    "Sam"                   |
|      [ avatar ]  ~~~~  [ avatar ]                |
|        ** **    energy   ** **                   |
|        *****    arc      *****                   |
|         ***    between    ***                    |
|                                                  |
|   Colors harmonize toward shared cyan.           |
|   Particles sparkle in sync.                     |
|   Energy arc pulses between daemons.             |
|                                                  |
+--------------------------------------------------+
```

### What you see -- the cluster moment:
```
+--------------------------------------------------+
|                                                  |
|              * * * * * * *                       |
|            *   MERGED      *                     |
|           *    BEACON       *  <-- larger,       |
|            *  (icosahedron) *      brighter,     |
|              * * * * * * *         wireframe     |
|                                    rotating      |
|         /\       /\       /\                     |
|        /  \     /  \     /  \                    |
|        \  /     \  /     \  /                    |
|         \/       \/       \/                     |
|                                                  |
|      "Brett"  "Sam"    "Alex"                    |
|     [avatar] [avatar] [avatar]                   |
|       *****   *****    *****                     |
|    ~~~~  ~~~~~~~~  ~~~~~~~~                      |
|    energy arcs connect all three                 |
|                                                  |
|   All three daemons pulse in unison.             |
|   A fourth person across the room sees           |
|   the merged beacon and walks over.              |
|                                                  |
+--------------------------------------------------+
```

**User story:** *I walk toward Sam. Our daemons start to glow -- colors shift toward the same cyan, particles sparkle, an energy arc bridges between us. Alex walks over -- they have "AI Agents" too. A third arc forms. Then something new happens: a larger beacon appears above all three of us, rotating, glowing. It's a merged signal. Across the room, a fourth person sees it and starts walking toward us. Conversation gravity.*

**Judge reaction:** "That's the moment. That's emergent social physics. I want this at every conference I attend."

**Done means:**
- [ ] Proximity triggers resonance (daemons react within 8 units)
- [ ] Color harmonization toward shared topic palette
- [ ] Energy arcs visible between resonating pairs
- [ ] Synchronized pulse rhythm between resonating daemons
- [ ] 3+ compatible cluster creates merged beacon at centroid
- [ ] Merged beacon is larger, brighter, draws attention
- [ ] The whole sequence FEELS magical, not mechanical

---

## BAREBONES COMPLETE

> If the hackathon ended here, this is the submission:
>
> **Live URL.** Open it. Move around. Select your state. Pick your topics.
> Walk near someone compatible. Watch daemons light up. Find two more.
> Watch the merged beacon form. *That's daemon.*

---

## Phase 5: Whisper (NICE-TO-HAVE -- parallel track)

### What changes:
- Click your daemon. A chat bubble appears.
- Your daemon responds in character, shaped by your topics and social state.
- While waiting for Claude's response, the daemon visually "thinks" (pulse animation).

### What you see:
```
+--------------------------------------------------+
|                                                  |
|         /\                                       |
|        /  \                                      |
|        \  /                                      |
|         \/                                       |
|                                                  |
|       "Brett"     +---------------------------+  |
|      [ avatar ]   | You: Who should I talk to?|  |
|        *****      |                           |  |
|        *...*      | Daemon: I've noticed two  |  |
|         ***       | people nearby broadcasting |  |
|                   | spatial computing. Their   |  |
|                   | daemons are pulsing with   |  |
|                   | curiosity. Want me to      |  |
|                   | signal openness?           |  |
|                   +---------------------------+  |
|                                                  |
+--------------------------------------------------+
```

**User story:** *I click my daemon. "What should I talk about?" I ask. It responds in character: "I sense three people nearby exploring AI agents. Their daemons are restless -- they're looking for someone. You might be their missing piece." It knows my topics, my state, who's around me. It's not a chatbot -- it's MY companion.*

**Done means:**
- [ ] Click daemon opens chat bubble
- [ ] Claude Haiku responds in <2s with daemon personality
- [ ] Personality shaped by user's topics + state + nearby context
- [ ] "Thinking" pulse animation during API wait
- [ ] Chat dismissible, doesn't block movement

---

## Phase 6: Environment + Audio (NICE-TO-HAVE -- parallel track)

### What changes:
- The ground plane becomes an atmospheric space (via ManifolderMCP or hand-built).
- Spatial audio: resonance hums, beacon activation chimes, whisper notification.
- Skybox, volumetric lighting, mood.

### What you see:
```
+--------------------------------------------------+
|  ~~~~~~~~~~~~ starfield / nebula sky ~~~~~~~~~~  |
|                                                  |
|     Volumetric light shafts from above           |
|                                                  |
|         /\                    /\                 |
|        /  \                  /  \                |
|                                                  |
|       "Brett"    ~~~~    "Sam"                   |
|      [ avatar ]  ~~~~  [ avatar ]                |
|        *****             *****                   |
|                                                  |
|   ~~~~ textured ground with subtle glow ~~~~    |
|   ~~~~ where resonance clusters form     ~~~~    |
|                                                  |
|   AUDIO: low harmonic hum from resonance,        |
|   chime when beacon activates, spatial falloff   |
+--------------------------------------------------+
```

**User story:** *The space feels like somewhere. Not a tech demo -- a place. When Sam and I resonate, I hear a low harmonic hum that grows as we get closer. When I activate my beacon, a crystalline chime rings out. The ground beneath our cluster glows faintly. It's not just functional anymore -- it's beautiful.*

**Done means:**
- [ ] Environment has atmosphere (not just a grid plane)
- [ ] At least 2 spatial audio cues (resonance hum, beacon chime)
- [ ] Audio scales with proximity
- [ ] Performance stays smooth

---

## Phase 7: Advanced (DELICIOSO -- if 5+ team)

### What changes:
- Multiple daemon creature forms (not just particle cloud).
- Daemon-to-daemon introduction: your daemon talks to theirs before you speak.
- Smart suggestions: "you might want to talk to them."

### What you see:
```
+--------------------------------------------------+
|                                                  |
|   Brett's daemon (fox-like form) approaches      |
|   Sam's daemon (bird-like form). They circle     |
|   each other. A small exchange happens:          |
|                                                  |
|      fox-daemon: "My human is exploring AI       |
|      agents and loves spatial computing.         |
|      Yours?"                                     |
|                                                  |
|      bird-daemon: "Mine too -- and they're       |
|      open to collaborate. Should we introduce    |
|      them?"                                      |
|                                                  |
|   Both daemons return to their humans with a     |
|   subtle glow. A notification appears:           |
|                                                  |
|   +---------------------------------------+      |
|   | Your daemon met Sam's daemon.         |      |
|   | You share: AI Agents, Spatial Computing|      |
|   | They're open to collaborate.          |      |
|   +---------------------------------------+      |
|                                                  |
+--------------------------------------------------+
```

**User story:** *My daemon -- now a fox-like form I've grown attached to -- drifts toward someone else's bird-daemon. They circle each other, exchanging information. My daemon returns and tells me: "Sam is interested in the same things you are, and they're looking for collaborators." I didn't have to do anything. My daemon negotiated on my behalf. I just have to walk over and say hi.*

**Done means:**
- [ ] 3+ distinct daemon creature forms
- [ ] Daemon-to-daemon AI exchange (Claude Haiku both sides)
- [ ] Introduction notification with shared context
- [ ] Smart suggestion: directional hint toward compatible people

---

## The Progression (summary)

```
Phase 0  Scaffold     "It's a 3D scene"
   |
Phase 1  Foundation   "It's multiplayer"
   |
Phase 2  Companion    "Everyone has a living companion that shows their state"
   |
Phase 3  Signal       "I can see what everyone cares about from across the room"
   |
Phase 4  Resonance    "Walk near your people. Magic happens. Groups form visibly."
   |                   ^^^ BAREBONES COMPLETE -- this wins ^^^
   |
Phase 5  Whisper      "My daemon knows me and advises me"
   |
Phase 6  Environment  "The space feels real and sounds alive"
   |
Phase 7  Advanced     "Daemons talk to each other on your behalf"
```

Each phase makes the previous one more powerful.
None of them make sense without Resonance.
Resonance is the demo. Every hour serves that moment.
