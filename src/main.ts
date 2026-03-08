import * as THREE from 'three';
import { createScene } from './scene';
import { Avatar } from './avatar';
import { Daemon } from './daemon';
import { PlayerControls } from './controls';
import { ResonanceSystem, DaemonEntry } from './resonance';
import { PeerManager } from './peers';
import { initUI } from './ui';
import { initFormSelector, FormId } from './form-selector';
import { SocialState, TopicId } from './types';
import { showConfigUI } from './config-ui';
import { MSFBridge } from './msf-bridge';
import { GLTFExporter } from 'three-stdlib';
import { InteractionFXSystem } from './interaction-fx';
import { ToneReactor } from './tone-reactor';
import { ThoughtBubbleSystem } from './thought-bubble';
import { ChatUI } from './chat-ui';

// --- Setup ---
const { scene, camera, renderer } = createScene();
const clock = new THREE.Clock();

// Player
const playerAvatar = new Avatar(0x99aabb);
scene.add(playerAvatar.group);

const playerDaemon = new Daemon();
scene.add(playerDaemon.group);

const controls = new PlayerControls(camera, renderer.domElement);

// Systems
const resonanceSystem = new ResonanceSystem(scene);
const peerManager = new PeerManager(scene);
const interactionFX = new InteractionFXSystem(scene);
const toneReactor = new ToneReactor(playerDaemon);
const thoughtBubbles = new ThoughtBubbleSystem(scene, playerDaemon.group);
const _chatUI = new ChatUI(toneReactor, thoughtBubbles);

// Player state — start with default topics so resonance works immediately
let playerTopics: TopicId[] = ['spatial-computing', 'ai-agents'];
playerDaemon.setTopics(playerTopics);
let msfBridge: MSFBridge | null = null;

// Connection status indicator
const statusDot = document.createElement('div');
statusDot.id = 'connection-status';
statusDot.style.cssText = `
  position: fixed;
  bottom: 12px;
  right: 12px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #666;
  z-index: 30;
  transition: background 0.3s;
  box-shadow: 0 0 6px rgba(0,0,0,0.5);
`;
document.body.appendChild(statusDot);

function setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
  const colors = { disconnected: '#666', connecting: '#cc9933', connected: '#33cc66' };
  statusDot.style.background = colors[status];
  statusDot.title = `Fabric: ${status}`;
}

// UI
initUI(
  (state: SocialState) => {
    playerDaemon.setState(state);
  },
  (topics: TopicId[]) => {
    playerTopics = topics;
    playerDaemon.setTopics(topics);
  },
);

// Form selector
initFormSelector((formId: FormId) => {
  playerDaemon.setForm(formId);
});

// --- Exporter Utility ---
(window as any).exportAllFormsToGLB = async () => {
  console.log('Starting export of all daemon forms...');
  const exporter = new GLTFExporter();
  const forms: FormId[] = ['wisp', 'ember', 'tide', 'lattice', 'murmur', 'phantom', 'pulse', 'sigil'];

  // Create a clean scene for exporting
  const exportScene = new THREE.Scene();
  const exportDaemon = new Daemon();
  exportScene.add(exportDaemon.group);

  // Move it to origin so it's centered in the GLB
  exportDaemon.group.position.set(0, 0, 0);

  for (const formId of forms) {
    console.log(`Exporting ${formId}...`);
    exportDaemon.setForm(formId);

    // Run update a few times to spread things out and establish the form
    for (let i = 0; i < 150; i++) {
      exportDaemon.update(0.016);
    }

    // Tell exporter to preserve point/line/mesh structure
    const options = {
      trs: false,
      onlyVisible: true,
      binary: true,
      maxTextureSize: 1024
    };

    try {
      const gltb: ArrayBuffer = await new Promise((resolve, reject) => {
        exporter.parse(
          exportScene,
          (gltf) => resolve(gltf as ArrayBuffer),
          (error) => reject(error),
          options
        );
      });

      // trigger download
      const blob = new Blob([gltb], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `${formId}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // small delay between downloads
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`Error exporting ${formId}:`, e);
    }
  }
  console.log('Export complete.');
};

// --- Init flow ---
async function init() {
  const result = await showConfigUI();

  // Always spawn some simulated peers for a lively scene
  peerManager.spawnSimulatedPeers(5);

  if (result.mode === 'msf' && result.config) {
    setConnectionStatus('connecting');
    msfBridge = new MSFBridge(result.config);
    const ok = await msfBridge.connect();
    if (ok) {
      setConnectionStatus('connected');
      peerManager.connectToMSF(msfBridge);
    } else {
      setConnectionStatus('disconnected');
      msfBridge = null;
    }
  } else {
    setConnectionStatus('disconnected');
  }

  // Start game loop
  animate();
}

// --- Game Loop ---
let publishTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.getElapsedTime();

  // Update player
  const playerPos = controls.update(dt);
  playerAvatar.setPosition(playerPos.x, 0, playerPos.z);
  playerDaemon.setFollowTarget(playerPos);
  playerDaemon.update(dt);

  // Update peers
  peerManager.update(dt, playerPos);

  // Publish player state to MSF
  if (msfBridge?.isConnected()) {
    publishTimer += dt;
    if (publishTimer > 0.1) { // 10Hz
      publishTimer = 0;
      const serialized = playerDaemon.toSerializable();
      msfBridge.publishPlayer({
        ...serialized,
        displayName: 'Player',
      });
    }
  }

  // Build daemon entries for resonance
  const entries: DaemonEntry[] = [
    {
      id: 'player',
      daemon: playerDaemon,
      position: playerPos,
      topics: playerTopics,
    },
    ...peerManager.getEntries(),
  ];

  // Update resonance
  const links = resonanceSystem.update(entries, time);

  // Midpoint interaction particles
  interactionFX.update(entries, links, time);

  // Tone reactor + thought bubbles
  toneReactor.update(dt);
  thoughtBubbles.update(dt);

  // Render
  renderer.render(scene, camera);
}

init();
