Below is a dev-team-ready summary of what we learned about RP1 Services, Environments, and the recommended approach for a **fabric-specific “daemon attach” service** that lets any user in one specific fabric place a static GLB above their own avatar.

## Executive summary

In RP1’s published architecture, a **Service** is a networked capability that a metaverse browser can connect to and load into a shared 3D map. RP1 defines a service as “a collection of functions for communicating data over a network,” and describes the metaverse browser as rendering **objects and services** together in a shared map, where they can interact with the user in real time. ([RP1][1])

A **Spatial Fabric** is the layer that manages shared resources for a segment of the metaverse, including **Identity, Credentials, Persona, Inventory, Map, Audio, and Menus**. That is important because our daemon feature depends on at least three of those shared resources: **Persona** (the user/avatar), **Map** (where the daemon appears), and **Menus** (for the UI flow). ([RP1][1])

An **Environment** in the RP1 Developer Center appears to be a concrete deployable instance of a service. While this detail comes from the UI wording rather than the public white paper, the screen language you captured—“Establish an instance of your service by first registering a server path…” with fields for service type, secure flag, and endpoint—strongly implies that an environment is the actual network target RP1 connects to for a service instance. This interpretation is consistent with RP1’s published service-centric architecture, but the exact official definition was not available in the public docs we found. ([RP1][1])

For this project, the right strategy is to build **one dedicated `daemons` service** for **one specific RP1 fabric**. That service should own user-to-daemon attachment state and expose a simple API for: selecting a daemon, attaching it to the current user, and updating or removing it. The daemon itself should be treated as a **user-owned visual entity** rendered relative to that user’s avatar in that fabric.

## What we know from RP1’s public material

RP1’s white paper states that metaverse browsers are different from web browsers because they contact and import **many services** into a shared scene graph or map. Those services can then “interact fluidly with each other and with the user in real-time.” ([RP1][1])

The same document says a spatial fabric manages shared resources for a metaverse segment, and explicitly lists these shared resources:

* Identity
* Credentials
* Persona, including avatar and name
* Inventory
* Map, defined as the collection of objects and services in a virtual world
* Audio
* Menus ([RP1][1])

RP1 also says the Developer Center is intended to let developers add **objects and services into the map**, with example use cases including AI pets, concierge staff, directions, signage, and fully virtual experiences. That gives us strong conceptual support for a daemon companion feature. ([RP1][1])

The glossary also describes the Metaversal Model Foundation, or **MVMF**, as the class library for “transferring and updating models of objects stored and manipulated in a service onto a client computer.” That is the strongest public hint that service-owned object representations can be synchronized from backend services to the client/browser. ([RP1][1])

## What this means for the daemon concept

For our use case, a daemon does not need to start as a full AI companion. The minimal viable daemon can simply be:

* a static GLB asset
* attached to one user
* displayed above that user’s avatar
* optionally chosen from a small catalog
* only active inside one specific fabric

That fits RP1’s model well because:

* the daemon’s identity belongs to the current user’s **Persona**
* the visual placement belongs in the **Map**
* the selection flow can happen through **Menus**
* the actual state and coordination can live in a networked **Service** ([RP1][1])

## Recommended architecture

Build a dedicated service named something like `daemons` with a production environment that RP1 can connect to over a simple protocol. For a first version, **REST** is the safest starting assumption because it is simpler to implement and RP1 explicitly mentions that asynchronous protocols like REST still have a place, even though real-time services will be important in the broader metaverse. ([RP1][1])

Later, if the daemon needs smooth follow behavior, mood changes, peer-to-peer interactions, or dynamic animation updates, the team can add a real-time layer such as Socket I/O. RP1’s white paper says that “the lion’s share of metaverse services will be real-time,” so a live channel is likely the eventual direction if this feature expands. ([RP1][1])

### Core components

The service should have four conceptual layers.

**1. Daemon catalog**
A list of available static GLB options and their metadata.
Example fields:

* daemon id
* display name
* GLB URL
* icon/thumbnail URL
* default offset above avatar
* default scale
* optional tint or style metadata

**2. User daemon attachment state**
One record per user per fabric.
Example fields:

* fabric id
* user id or persona id
* selected daemon id
* attached flag
* anchor mode, such as `above_avatar`
* position offset, for example `(0, 2.1, 0)`
* rotation offset
* scale
* visibility flag
* updated at

**3. Service API**
Endpoints to read and write daemon selection and attachment state.

**4. Render/update bridge**
Whatever RP1 requires to get the selected GLB represented in-world relative to the avatar. The public docs strongly imply this exists conceptually, but they do not yet document the exact API shape publicly. ([RP1][1])

## Recommended first implementation scope

The dev team should target a very narrow v1:

A user inside the specific fabric can:

* open a simple interface
* choose one of several static GLB daemon assets
* save that choice
* have the chosen GLB appear above their avatar
* replace or remove it later

No pathfinding, no AI, no independent locomotion, no behavior tree. Just “attach static GLB above avatar.”

That keeps the project aligned with what we know RP1 supports conceptually, while minimizing dependency on undocumented real-time or object-authoring APIs.

## Interaction model

Support both of these interaction patterns, but route them to the same backend action.

### A. Interface-driven selection

This is the cleanest v1.

Flow:

1. User opens a daemon UI panel.
2. User sees a catalog of daemon options.
3. User selects one and clicks Save.
4. Client sends the selection to the `daemons` service.
5. Service stores attachment state for that user in that fabric.
6. Client or service causes the chosen GLB to appear above the user’s avatar.

This is the most realistic first milestone because RP1 explicitly lists **Menus** and **Persona** as shared constructs inside a spatial fabric. ([RP1][1])

### B. Touch/click in-world

This is useful as a secondary UX path.

Flow:

1. User touches a kiosk, pedestal, orb, or their own avatar anchor.
2. Interaction opens the same daemon picker UI, or directly attaches a default daemon.
3. The same save action runs.

This works well if the team can make or place an interactable object in the fabric, but it is not necessary for the first delivery.

## Proposed service contract

These are suggested API endpoints for v1. They are not RP1-defined; they are our recommended service surface.

* `GET /catalog`
  Returns available daemon GLB options.

* `GET /me`
  Returns the current user’s daemon selection and attachment state for the current fabric.

* `POST /attach`
  Body:

  * fabricId
  * daemonId
  * anchorMode: `above_avatar`
  * offset
  * scale

  Result:

  * success
  * current attachment state

* `POST /detach`
  Body:

  * fabricId

* `POST /update`
  Body:

  * fabricId
  * offset and/or scale adjustments

The service should treat the currently authenticated RP1 user as the authority for which daemon record is being changed. Since RP1 says credentials and identity are shared resources in the fabric, the service should use RP1-provided identity/session context if available rather than inventing a separate user system. ([RP1][1])

## Suggested data model

For a minimal database table:

**daemon_catalog**

* id
* name
* glb_url
* thumbnail_url
* default_offset_x
* default_offset_y
* default_offset_z
* default_scale
* active

**user_daemon_attachment**

* id
* fabric_id
* user_id or persona_id
* daemon_id
* attached
* anchor_mode
* offset_x
* offset_y
* offset_z
* scale
* created_at
* updated_at

Recommended rule: one active daemon attachment per user per fabric.

## Placement behavior

The simplest visual rule is:

* anchor the daemon to the user’s avatar root or head anchor
* apply a vertical offset so the model floats above the user
* keep the GLB static except for any baked animation already inside the GLB
* update transform whenever the avatar moves

If RP1 supports per-frame or event-based avatar transform updates to services, use that. If not, the client-side fabric integration may need to re-render the daemon relative to the avatar using current persona/avatar position. The public RP1 materials make this sort of synced object presentation conceptually plausible through the map and MVMF model, but they do not yet publish the exact implementation pattern. ([RP1][1])

## What the dev team should assume about “Environment”

Based on the Developer Center screens you captured, the team should treat an RP1 environment as:

* one deployable instance of the `daemons` service
* configured with protocol type
* reachable at a specific endpoint
* optionally secure
* likely attachable to the relevant fabric after registration

This is an informed interpretation from the UI and is consistent with RP1’s public architecture, but it remains a practical assumption rather than a public documented guarantee from the white paper. ([RP1][1])

For v1:

* create one **Production** environment
* start with **REST**
* host the service at one HTTPS endpoint
* use secure transport

## Where the public documentation stops

The public white paper is useful conceptually, but the detailed sections on **Maps**, **Services**, and **Statabases** are still marked “Coming soon,” so we do not have official public answers yet for:

* how a third-party service mutates map state
* how services register menu entries
* how services bind visual entities to avatars
* what exact role **Statbase** plays
* whether the daemon should be modeled as an object, a service-backed object, or a client projection of service state
* the precise auth and permissions model between user, fabric, and service ([RP1][1])

Because of that, the dev team should frame the current plan as an implementation strategy aligned to RP1’s published architecture, not as a guaranteed final RP1 integration contract.

## Recommended build plan

### Phase 1: attachment MVP

Goal: static GLB above avatar inside one fabric.

Deliverables:

* `daemons` service running in production
* daemon catalog with 3 to 5 GLB options
* simple picker UI
* user-specific selection save/load
* one active daemon per user
* daemon rendered above avatar in that fabric

### Phase 2: improved presence

Only after MVP works.

Possible additions:

* summon/dismiss button
* per-daemon scale and offset tweaks
* fabric-specific permissions
* simple hover label or status ring
* live update transport if needed

### Phase 3: richer daemon behavior

Only if RP1 integration supports it smoothly.

Possible additions:

* orbit or perch behavior
* socket-based live updates
* daemon-to-daemon interactions
* mood/topic indicators
* social signaling

## Final recommendation to the team

Build `daemons` as a **fabric-specific service-backed attachment system**, not as a full autonomous creature system.

The v1 product should be:

* one service
* one environment
* one fabric
* one daemon selection per user
* one static GLB rendered above that user’s avatar

That approach is directly supported by what RP1 has published about services, fabrics, persona, menus, maps, and service-driven object presentation, while staying safely inside the boundaries of what is currently documented publicly. ([RP1][1])

turn this into a one-page technical spec next, with API shapes, data schema, and implementation milestones.

[1]: https://cdn.rp1.com/whitepaper.pdf?utm_source=chatgpt.com "RP1 White Paper - AWE 2024"

image references:
"\\wsl.localhost\Ubuntu\home\bam\projects\daemon-mvp\project\Screenshot 2026-03-07 235311.png"
"\\wsl.localhost\Ubuntu\home\bam\projects\daemon-mvp\project\Screenshot 2026-03-08 000908.png"
"\\wsl.localhost\Ubuntu\home\bam\projects\daemon-mvp\project\Screenshot 2026-03-07 233013.png"