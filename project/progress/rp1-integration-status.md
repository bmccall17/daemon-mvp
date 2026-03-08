# RP1 MSF Integration Status Report

**Date:** March 7, 2026
**Environment:** `team011.hackathon.rp1.dev`
**Goal:** Render Daemon 3D models natively inside the RP1 client.

## 1. The Situation

The MVP application connects to the Metaverse Spatial Fabric (MSF) successfully via the browser using `ManifolderClient.js`. 

We have successfully:
1. Created the `daemon-social-space` scene (ID: `physical:1`) on the hackathon fabric.
2. Verified that our web client can connect, create objects, and synchronize movements between multiple browser tabs.
3. Exported static `.glb` versions of our procedural Three.js Daemons and hosted them on GitHub Pages.
4. Updated `msf-bridge.ts` to attach the URL of these `.glb` files to the `resourceReference` property of the MSF objects.

## 2. The Problems Encountered

### Problem A: The Name Length DB Error
**Issue:** We initially serialized the peer state (form, topics, social state) into the object `name` field to broadcast it to other peers. This triggered a database error on the MSF server:
`Error: Data too long for column 'Name_wsRMPObjectId'`
**Status:** **RESOLVED by our team.** We modified `msf-bridge.ts` to store the state payload in the `properties` field instead of the `name` field, which successfully bypassed the length limit and stopped the database errors.

### Problem B: Cannot Load the Scene in RP1 RESOLVED!
**Issue:** While the web client shows successful connection and object creation, we are unable to view the `daemon-social-space` scene inside an actual RP1 client environment to verify the models are rendering.
- Navigating to `https://team011.hackathon.rp1.dev/web/` results in a `Cannot GET /web` error.
- Checking the Network tab in the browser console for the fabric endpoint (`https://team011.hackathon.rp1.dev/fabric/`) shows connection initialization configurations (e.g., `"sConnect": "secure=true;server=team011.hackathon.rp1.dev;port=443;session=RP1"`), but no rendering client is served.

## 3. What "Done" Looks Like

For this phase of the hackathon MVP to be considered complete, the following criteria must be met:

1. **Access:** A user can open a specific URL or launch a specific RP1 viewer client that connects to the `team011` hackathon fabric.
2. **Presence:** The user can enter the `daemon-social-space` scene.
3. **Rendering:** When our web client creates a Daemon object with a `resourceReference` pointing to a `.glb` file (e.g., `https://bmccall17.github.io/daemon-mvp/models/wisp.glb`), the RP1 viewer natively downloads and renders that 3D model in the space.

## 4. Questions for the Dev Team

To unblock us, we need guidance on the following:

1. **Viewer Access:** What is the correct URL or application to view the `team011.hackathon.rp1.dev` fabric? We expected a web viewer at `/web`, but it is returning a 404. Is there a standalone client we should download and configure, or a different URL path?
2. **Resource References:** Assuming we get into the viewer, does the current hackathon build of the RP1 client natively fetch and render `.glb` files provided in the `resourceReference` field of an MSF object? Are there any CORS requirements or specific CDN configurations we need for our GitHub Pages hosted models?
