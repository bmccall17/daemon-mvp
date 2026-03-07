import * as THREE from 'three';
import { Avatar } from './avatar';
import { Daemon } from './daemon';
import { SocialState, TopicId, TOPICS, PeerState, MSFConfig } from './types';
import { FormId, FORMS } from './form-selector';
import { MSFBridge } from './msf-bridge';

const PEER_COLORS = [0x6688aa, 0xaa6688, 0x88aa66, 0x8866aa, 0xaa8866];
const FORM_IDS: FormId[] = FORMS.map(f => f.id);

interface SimPeer {
  id: string;
  avatar: Avatar;
  daemon: Daemon;
  targetPos: THREE.Vector3;
  moveTimer: number;
  socialState: SocialState;
  topics: TopicId[];
  displayName: string;
  formId: FormId;
}

interface MSFPeer {
  id: string;
  avatar: Avatar;
  daemon: Daemon;
  lastUpdate: number;
}

export class PeerManager {
  private peers: SimPeer[] = [];
  private msfPeers: Map<string, MSFPeer> = new Map();
  private scene: THREE.Scene;
  private mode: 'simulated' | 'msf' = 'simulated';
  private msfBridge?: MSFBridge;
  private msfPollTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  connectToMSF(bridge: MSFBridge) {
    this.mode = 'msf';
    this.msfBridge = bridge;
    // Remove simulated peers
    for (const peer of this.peers) {
      this.scene.remove(peer.avatar.group);
      this.scene.remove(peer.daemon.group);
    }
    this.peers = [];
  }

  disconnectMSF() {
    this.mode = 'simulated';
    this.msfBridge = undefined;
    // Clean up MSF peers
    for (const [, peer] of this.msfPeers) {
      this.scene.remove(peer.avatar.group);
      this.scene.remove(peer.daemon.group);
    }
    this.msfPeers.clear();
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

      // Random form for visual variety
      const formId = FORM_IDS[Math.floor(Math.random() * FORM_IDS.length)];
      daemon.setForm(formId);

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
        formId,
      });
    }
  }

  update(dt: number, playerPos: THREE.Vector3) {
    if (this.mode === 'msf') {
      this.updateMSFPeers(dt);
    } else {
      this.updateSimulated(dt, playerPos);
    }
  }

  private updateSimulated(dt: number, playerPos: THREE.Vector3) {
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

  private async updateMSFPeers(dt: number) {
    if (!this.msfBridge) return;

    this.msfPollTimer -= dt;
    if (this.msfPollTimer <= 0) {
      this.msfPollTimer = 0.5; // Poll at 2Hz

      try {
        const peerStates = await this.msfBridge.fetchPeers();
        const now = Date.now();

        // Update or create peers
        for (const state of peerStates) {
          let msfPeer = this.msfPeers.get(state.id);
          if (!msfPeer) {
            const avatar = new Avatar(PEER_COLORS[this.msfPeers.size % PEER_COLORS.length]);
            const daemon = new Daemon();
            if (state.formId) daemon.setForm(state.formId as FormId);
            this.scene.add(avatar.group);
            this.scene.add(daemon.group);
            msfPeer = { id: state.id, avatar, daemon, lastUpdate: now };
            this.msfPeers.set(state.id, msfPeer);
          }

          msfPeer.lastUpdate = now;
          msfPeer.avatar.setPosition(state.position.x, 0, state.position.z);
          msfPeer.daemon.setState(state.socialState);
          msfPeer.daemon.setTopics(state.topics);
          if (state.formId) msfPeer.daemon.setForm(state.formId as FormId);
        }

        // Remove timed-out peers (10s)
        for (const [id, peer] of this.msfPeers) {
          if (now - peer.lastUpdate > 10000) {
            this.scene.remove(peer.avatar.group);
            this.scene.remove(peer.daemon.group);
            this.msfPeers.delete(id);
          }
        }
      } catch {
        // Silently handle fetch errors
      }
    }

    // Update all MSF peer daemons
    for (const [, peer] of this.msfPeers) {
      const pos = peer.avatar.getPosition();
      peer.daemon.setFollowTarget(pos);
      peer.daemon.update(dt);
    }
  }

  getEntries() {
    if (this.mode === 'msf') {
      return Array.from(this.msfPeers.values()).map(p => ({
        id: p.id,
        daemon: p.daemon,
        position: p.avatar.getPosition(),
        topics: p.daemon.getTopics(),
      }));
    }
    return this.peers.map(p => ({
      id: p.id,
      daemon: p.daemon,
      position: p.avatar.getPosition(),
      topics: p.topics,
    }));
  }
}
