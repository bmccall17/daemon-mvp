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

// Player state
let playerTopics: TopicId[] = [];
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

// --- Init flow ---
async function init() {
  const result = await showConfigUI();

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
      // Fall back to simulated
      peerManager.spawnSimulatedPeers(5);
    }
  } else {
    setConnectionStatus('disconnected');
    peerManager.spawnSimulatedPeers(5);
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
  resonanceSystem.update(entries, time);

  // Render
  renderer.render(scene, camera);
}

init();
