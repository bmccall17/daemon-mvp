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

// Spawn 5 simulated peers for testing
peerManager.spawnSimulatedPeers(5);

// Player state
let playerTopics: TopicId[] = [];

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
  console.log(`Daemon form selected: ${formId}`);
  // TODO: swap player daemon's visual form
});

// --- Game Loop ---
function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05); // cap delta
  const time = clock.getElapsedTime();

  // Update player
  const playerPos = controls.update(dt);
  playerAvatar.setPosition(playerPos.x, 0, playerPos.z);
  playerDaemon.setFollowTarget(playerPos);
  playerDaemon.update(dt);

  // Update peers
  peerManager.update(dt, playerPos);

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

animate();
