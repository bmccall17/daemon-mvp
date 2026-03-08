import * as THREE from 'three';
import { Daemon } from './daemon';
import { SocialState } from './types';
import { ToneResult, TonePrimary } from './tone-analyzer';

// Maps tone → social state
const TONE_STATE_MAP: Partial<Record<TonePrimary, SocialState>> = {
  curious: SocialState.SEEKING,
  excited: SocialState.BROADCASTING,
  contemplative: SocialState.FOCUSED,
  supportive: SocialState.OPEN,
  playful: SocialState.BROADCASTING,
  argumentative: SocialState.FOCUSED,
};

// Warm/cool color shift based on valence
const WARM = new THREE.Color(1.0, 0.6, 0.2);
const COOL = new THREE.Color(0.2, 0.5, 1.0);

export class ToneReactor {
  private daemon: Daemon;
  private targetExcitement = 0;
  private currentValenceColor = new THREE.Color(1, 1, 1);

  constructor(daemon: Daemon) {
    this.daemon = daemon;
  }

  applyTone(tone: ToneResult) {
    // Map tone to social state
    const newState = TONE_STATE_MAP[tone.primary];
    if (newState) {
      this.daemon.setState(newState);
    }

    // Set excitement from arousal
    this.targetExcitement = tone.arousal;

    // Auto-select topics from hints
    if (tone.topicHints.length > 0) {
      this.daemon.setTopics(tone.topicHints);
    }

    // Valence → color shift
    if (tone.valence > 0.1) {
      this.currentValenceColor.copy(WARM);
    } else if (tone.valence < -0.1) {
      this.currentValenceColor.copy(COOL);
    } else {
      this.currentValenceColor.set(1, 1, 1);
    }
  }

  update(dt: number) {
    // Smooth excitement toward target, decay over time
    this.daemon.excitementLevel += (this.targetExcitement - this.daemon.excitementLevel) * dt * 3;
    this.targetExcitement *= (1 - dt * 0.5); // gradual decay

    // Apply valence color blend to resonance color
    if (this.daemon.excitementLevel > 0.05) {
      this.daemon.resonanceColor.lerp(this.currentValenceColor, this.daemon.excitementLevel * 0.3);
    }
  }
}
