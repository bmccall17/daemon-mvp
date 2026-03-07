import * as THREE from 'three';

export enum SocialState {
  OPEN = 'OPEN',
  SEEKING = 'SEEKING',
  FOCUSED = 'FOCUSED',
  BROWSING = 'BROWSING',
  BROADCASTING = 'BROADCASTING',
}

export const SOCIAL_STATE_CONFIG: Record<SocialState, {
  label: string;
  color: THREE.Color;
  particleSpread: number;
  pulseSpeed: number;
  brightness: number;
  orbitRadius: number;
}> = {
  [SocialState.OPEN]: {
    label: 'Open',
    color: new THREE.Color(0.9, 0.7, 0.3),
    particleSpread: 1.2,
    pulseSpeed: 1.0,
    brightness: 0.9,
    orbitRadius: 1.5,
  },
  [SocialState.SEEKING]: {
    label: 'Seeking',
    color: new THREE.Color(0.3, 0.7, 1.0),
    particleSpread: 1.5,
    pulseSpeed: 1.8,
    brightness: 1.0,
    orbitRadius: 2.0,
  },
  [SocialState.FOCUSED]: {
    label: 'Focused',
    color: new THREE.Color(0.6, 0.3, 0.9),
    particleSpread: 0.5,
    pulseSpeed: 0.4,
    brightness: 0.5,
    orbitRadius: 0.8,
  },
  [SocialState.BROWSING]: {
    label: 'Browsing',
    color: new THREE.Color(0.5, 0.6, 0.5),
    particleSpread: 0.8,
    pulseSpeed: 0.6,
    brightness: 0.4,
    orbitRadius: 1.2,
  },
  [SocialState.BROADCASTING]: {
    label: 'Broadcasting',
    color: new THREE.Color(1.0, 0.4, 0.3),
    particleSpread: 1.8,
    pulseSpeed: 2.5,
    brightness: 1.2,
    orbitRadius: 1.8,
  },
};

export const TOPICS = [
  { id: 'ai-agents', label: 'AI Agents', color: new THREE.Color(0.3, 0.8, 1.0) },
  { id: 'spatial-computing', label: 'Spatial Computing', color: new THREE.Color(0.6, 0.3, 1.0) },
  { id: 'game-design', label: 'Game Design', color: new THREE.Color(1.0, 0.5, 0.2) },
  { id: 'music', label: 'Music', color: new THREE.Color(1.0, 0.3, 0.6) },
  { id: 'worldbuilding', label: 'Worldbuilding', color: new THREE.Color(0.2, 0.9, 0.4) },
  { id: 'accessibility', label: 'Accessibility', color: new THREE.Color(1.0, 0.85, 0.2) },
  { id: 'open-standards', label: 'Open Standards', color: new THREE.Color(0.4, 0.7, 0.9) },
  { id: 'social-presence', label: 'Social Presence', color: new THREE.Color(0.9, 0.4, 0.8) },
] as const;

export type TopicId = typeof TOPICS[number]['id'];

// Pre-computed topic vectors (simplified: one-hot + blended similarity)
// In production, these would come from actual embeddings
export const TOPIC_VECTORS: Record<string, number[]> = {
  'ai-agents':         [1.0, 0.6, 0.2, 0.0, 0.3, 0.2, 0.4, 0.5],
  'spatial-computing': [0.6, 1.0, 0.4, 0.1, 0.5, 0.3, 0.6, 0.7],
  'game-design':       [0.2, 0.4, 1.0, 0.3, 0.8, 0.2, 0.1, 0.3],
  'music':             [0.0, 0.1, 0.3, 1.0, 0.2, 0.1, 0.0, 0.2],
  'worldbuilding':     [0.3, 0.5, 0.8, 0.2, 1.0, 0.2, 0.2, 0.4],
  'accessibility':     [0.2, 0.3, 0.2, 0.1, 0.2, 1.0, 0.5, 0.6],
  'open-standards':    [0.4, 0.6, 0.1, 0.0, 0.2, 0.5, 1.0, 0.5],
  'social-presence':   [0.5, 0.7, 0.3, 0.2, 0.4, 0.6, 0.5, 1.0],
};

export interface PeerState {
  id: string;
  position: THREE.Vector3;
  socialState: SocialState;
  topics: TopicId[];
  displayName: string;
  formId?: string;
  lastUpdate?: number;
}

export interface MSFConfig {
  fabricUrl: string;
  adminKey: string;
  sceneId: string;
  syncRates: {
    positionHz: number;
    stateHz: number;
  };
  peerTimeoutMs: number;
}

export interface ResonanceLink {
  fromId: string;
  toId: string;
  strength: number;
  sharedTopics: TopicId[];
}
