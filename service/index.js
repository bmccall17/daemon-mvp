const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// --- Middleware ---

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

// Log ALL incoming requests (headers, body, query) for RP1 discovery
app.use((req, _res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  if (Object.keys(req.query).length > 0) {
    console.log('Query:', JSON.stringify(req.query, null, 2));
  }
  console.log('========================\n');
  next();
});

// --- Daemon Catalog ---

const CATALOG = [
  { id: 'wisp',    name: 'Wisp',    glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/wisp.glb',    defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: 'ember',   name: 'Ember',   glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/ember.glb',   defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: 'tide',    name: 'Tide',    glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/tide.glb',    defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: 'lattice', name: 'Lattice', glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/lattice.glb', defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: 'murmur',  name: 'Murmur',  glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/murmur.glb', defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: 'phantom', name: 'Phantom', glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/phantom.glb', defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: 'pulse',   name: 'Pulse',   glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/pulse.glb',   defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
  { id: 'sigil',   name: 'Sigil',   glbUrl: 'https://bmccall17.github.io/daemon-mvp/models/sigil.glb',   defaultOffset: { x: 0, y: 2.1, z: 0 }, defaultScale: 0.5 },
];

// --- In-Memory Attachment State ---
// Map<userId, { daemonId, anchorMode, offset, scale, attachedAt }>

const attachments = new Map();

// --- User Identity Helper ---
// Extracts user ID from RP1 headers (unknown format), falls back to x-user-id header or query param

function getUserId(req) {
  // Check common RP1/auth headers (will discover the real one from logs)
  const candidates = [
    req.headers['x-rp1-user-id'],
    req.headers['x-user-id'],
    req.headers['x-forwarded-user'],
    req.query.userId,
    req.query.user_id,
  ];
  for (const id of candidates) {
    if (id) return id;
  }
  return null;
}

// --- Routes (mounted at both / and /daemons/ for reverse proxy compatibility) ---

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'daemons', version: '1.0.0' });
});

router.get('/catalog', (_req, res) => {
  res.json({ daemons: CATALOG });
});

router.get('/me', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: 'No user identity found. Send x-user-id header or userId query param.' });
  }
  const attachment = attachments.get(userId) || null;
  res.json({ userId, attachment });
});

router.post('/attach', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: 'No user identity found. Send x-user-id header or userId query param.' });
  }

  const { daemonId, anchorMode, offset, scale } = req.body;
  const daemon = CATALOG.find(d => d.id === daemonId);
  if (!daemon) {
    return res.status(400).json({ error: `Unknown daemonId: ${daemonId}`, available: CATALOG.map(d => d.id) });
  }

  const record = {
    daemonId,
    glbUrl: daemon.glbUrl,
    anchorMode: anchorMode || 'head',
    offset: offset || daemon.defaultOffset,
    scale: scale ?? daemon.defaultScale,
    attachedAt: new Date().toISOString(),
  };

  attachments.set(userId, record);
  console.log(`[ATTACH] User ${userId} attached daemon ${daemonId}`);
  res.json({ userId, attachment: record });
});

router.post('/detach', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: 'No user identity found. Send x-user-id header or userId query param.' });
  }

  const had = attachments.has(userId);
  attachments.delete(userId);
  console.log(`[DETACH] User ${userId} detached (had attachment: ${had})`);
  res.json({ userId, attachment: null, detached: had });
});

router.post('/update', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: 'No user identity found. Send x-user-id header or userId query param.' });
  }

  const current = attachments.get(userId);
  if (!current) {
    return res.status(404).json({ error: 'No daemon attached. Use /attach first.' });
  }

  const { offset, scale, anchorMode } = req.body;
  if (offset) current.offset = offset;
  if (scale !== undefined) current.scale = scale;
  if (anchorMode) current.anchorMode = anchorMode;

  attachments.set(userId, current);
  console.log(`[UPDATE] User ${userId} updated attachment`);
  res.json({ userId, attachment: current });
});

// Mount router at both paths
app.use('/', router);
app.use('/daemons', router);

// Catch-all: log unknown routes (helps discover what RP1 expects)
app.all('*', (req, res) => {
  console.log(`[UNKNOWN ROUTE] ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found', path: req.url, method: req.method });
});

// --- Start ---

app.listen(PORT, () => {
  console.log(`Daemons service running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Catalog: http://localhost:${PORT}/catalog`);
});
