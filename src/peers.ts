import * as THREE from 'three';
import { Avatar } from './avatar';
import { Daemon } from './daemon';
import { SocialState, TopicId, TOPICS } from './types';

/**
 * Simulated peer system -- creates AI-driven peers for single-player testing.
 * Will be replaced by real multiplayer via MSF/PartyKit.
 */

const PEER_COLORS = [0x6688aa, 0xaa6688, 0x88aa66, 0x8866aa, 0xaa8866];

interface SimPeer {
  id: string;
  avatar: Avatar;
  daemon: Daemon;
  targetPos: THREE.Vector3;
  moveTimer: number;
  socialState: SocialState;
  topics: TopicId[];
  displayName: string;
}

export class PeerManager {
  private peers: SimPeer[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnSimulatedPeers(count: number) {
    const states = Object.values(SocialState);
    const topicIds = TOPICS.map(t => t.id);

    for (let i = 0; i < count; i++) {
      const avatar = new Avatar(PEER_COLORS[i % PEER_COLORS.length]);
      const startX = (Math.random() - 0.5) * 20;
      const startZ = (Math.random() - 0.5) * 20;
      avatar.setPosition(startX, 0, startZ);

      const daemon = new Daemon();
      const state = states[Math.floor(Math.random() * states.length)];
      daemon.setState(state);

      // Give each peer 1-3 random topics
      const numTopics = 1 + Math.floor(Math.random() * 3);
      const shuffled = [...topicIds].sort(() => Math.random() - 0.5);
      const peerTopics = shuffled.slice(0, numTopics) as TopicId[];
      daemon.setTopics(peerTopics);

      this.scene.add(avatar.group);
      this.scene.add(daemon.group);

      this.peers.push({
        id: `peer-${i}`,
        avatar,
        daemon,
        targetPos: new THREE.Vector3(startX, 0, startZ),
        moveTimer: Math.random() * 5,
        socialState: state,
        topics: peerTopics,
        displayName: `Explorer ${i + 1}`,
      });
    }
  }

  update(dt: number, playerPos: THREE.Vector3) {
    for (const peer of this.peers) {
      // Wander behavior
      peer.moveTimer -= dt;
      if (peer.moveTimer <= 0) {
        peer.moveTimer = 3 + Math.random() * 6;

        // Sometimes wander toward player (curiosity)
        if (Math.random() < 0.3) {
          peer.targetPos.copy(playerPos);
          peer.targetPos.x += (Math.random() - 0.5) * 6;
          peer.targetPos.z += (Math.random() - 0.5) * 6;
        } else {
          peer.targetPos.set(
            (Math.random() - 0.5) * 20,
            0,
            (Math.random() - 0.5) * 20,
          );
        }
      }

      // Move toward target
      const pos = peer.avatar.getPosition();
      const diff = new THREE.Vector3().subVectors(peer.targetPos, pos);
      if (diff.length() > 0.5) {
        diff.normalize().multiplyScalar(1.5 * dt);
        pos.add(diff);
        peer.avatar.setPosition(pos.x, 0, pos.z);
      }

      // Update daemon
      peer.daemon.setFollowTarget(pos);
      peer.daemon.update(dt);
    }
  }

  getEntries() {
    return this.peers.map(p => ({
      id: p.id,
      daemon: p.daemon,
      position: p.avatar.getPosition(),
      topics: p.topics,
    }));
  }
}
