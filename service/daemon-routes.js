const CATALOG = [
  { id: "wisp",    name: "Wisp",    glbUrl: "https://bmccall17.github.io/daemon-mvp/models/wisp.glb",    defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: "ember",   name: "Ember",   glbUrl: "https://bmccall17.github.io/daemon-mvp/models/ember.glb",   defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: "tide",    name: "Tide",    glbUrl: "https://bmccall17.github.io/daemon-mvp/models/tide.glb",    defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: "lattice", name: "Lattice", glbUrl: "https://bmccall17.github.io/daemon-mvp/models/lattice.glb", defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: "murmur",  name: "Murmur",  glbUrl: "https://bmccall17.github.io/daemon-mvp/models/murmur.glb", defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: "phantom", name: "Phantom", glbUrl: "https://bmccall17.github.io/daemon-mvp/models/phantom.glb", defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: "pulse",   name: "Pulse",   glbUrl: "https://bmccall17.github.io/daemon-mvp/models/pulse.glb",   defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: "sigil",   name: "Sigil",   glbUrl: "https://bmccall17.github.io/daemon-mvp/models/sigil.glb",   defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
];

const attachments = new Map();

function getUserId(req) {
  const candidates = [
    req.headers["x-rp1-user-id"],
    req.headers["x-user-id"],
    req.headers["x-forwarded-user"],
    req.headers["session-token"],
    req.query.userId,
    req.query.user_id,
  ];
  for (const id of candidates) {
    if (id) return id;
  }
  return null;
}

function mount(app) {
  // Log all /daemons requests
  app.use("/daemons", (req, _res, next) => {
    console.log("\n=== DAEMON REQUEST ===");
    console.log(req.method + " " + req.originalUrl);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      console.log("Body:", JSON.stringify(req.body, null, 2));
    }
    console.log("========================\n");
    next();
  });

  app.get("/daemons/health", function(_req, res) {
    res.json({ status: "ok", service: "daemons", version: "1.0.0" });
  });

  app.get("/daemons/catalog", function(_req, res) {
    res.json({ daemons: CATALOG });
  });

  app.get("/daemons/me", function(req, res) {
    var userId = getUserId(req);
    if (userId === null) {
      return res.status(400).json({ error: "No user identity found. Send x-user-id header or userId query param." });
    }
    var attachment = attachments.get(userId) || null;
    res.json({ userId: userId, attachment: attachment });
  });

  app.post("/daemons/attach", function(req, res) {
    var userId = getUserId(req);
    if (userId === null) {
      return res.status(400).json({ error: "No user identity found. Send x-user-id header or userId query param." });
    }
    var daemonId = req.body.daemonId;
    var anchorMode = req.body.anchorMode;
    var offset = req.body.offset;
    var scale = req.body.scale;
    var daemon = CATALOG.find(function(d) { return d.id === daemonId; });
    if (daemon === undefined) {
      return res.status(400).json({ error: "Unknown daemonId: " + daemonId, available: CATALOG.map(function(d) { return d.id; }) });
    }
    var record = {
      daemonId: daemonId,
      glbUrl: daemon.glbUrl,
      anchorMode: anchorMode || "head",
      offset: offset || daemon.defaultOffset,
      scale: scale !== undefined ? scale : daemon.defaultScale,
      attachedAt: new Date().toISOString(),
    };
    attachments.set(userId, record);
    console.log("[ATTACH] User " + userId + " attached daemon " + daemonId);
    res.json({ userId: userId, attachment: record });
  });

  app.post("/daemons/detach", function(req, res) {
    var userId = getUserId(req);
    if (userId === null) {
      return res.status(400).json({ error: "No user identity found. Send x-user-id header or userId query param." });
    }
    var had = attachments.has(userId);
    attachments.delete(userId);
    console.log("[DETACH] User " + userId + " detached (had attachment: " + had + ")");
    res.json({ userId: userId, attachment: null, detached: had });
  });

  app.post("/daemons/update", function(req, res) {
    var userId = getUserId(req);
    if (userId === null) {
      return res.status(400).json({ error: "No user identity found. Send x-user-id header or userId query param." });
    }
    var current = attachments.get(userId);
    if (current === undefined) {
      return res.status(404).json({ error: "No daemon attached. Use /daemons/attach first." });
    }
    if (req.body.offset) current.offset = req.body.offset;
    if (req.body.scale !== undefined) current.scale = req.body.scale;
    if (req.body.anchorMode) current.anchorMode = req.body.anchorMode;
    attachments.set(userId, current);
    console.log("[UPDATE] User " + userId + " updated attachment");
    res.json({ userId: userId, attachment: current });
  });

  console.log("Daemon routes mounted at /daemons/*");
}

module.exports = { mount: mount };
