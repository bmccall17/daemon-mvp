import * as THREE from 'three';
import { TonePrimary } from './tone-analyzer';

const RESPONSES: Record<TonePrimary, string[]> = {
  curious: ['hmm...', 'what if...', '???', 'tell me more'],
  excited: ['YES!', '!!!', 'WOOO', 'let\'s GO'],
  supportive: ['I see you', 'together', '<3', 'yes, and...'],
  argumentative: ['but consider...', 'really?', 'hmm, no', 'are you sure?'],
  contemplative: ['...', 'deep...', '*thinks*', 'interesting'],
  playful: ['hehe', ':D', 'wild!', 'ooh!'],
  neutral: ['...', 'ok', 'noted', 'mm'],
};

interface BubbleEntry {
  sprite: THREE.Sprite;
  life: number;
  maxLife: number;
  startY: number;
}

export class ThoughtBubbleSystem {
  private scene: THREE.Scene;
  private parentGroup: THREE.Group;
  private bubbles: BubbleEntry[] = [];

  constructor(scene: THREE.Scene, parentGroup: THREE.Group) {
    this.scene = scene;
    this.parentGroup = parentGroup;
  }

  show(tone: TonePrimary) {
    const responses = RESPONSES[tone];
    const text = responses[Math.floor(Math.random() * responses.length)];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const c = canvas.getContext('2d')!;

    // Background pill
    c.fillStyle = 'rgba(10, 10, 20, 0.7)';
    c.beginPath();
    c.roundRect(4, 4, 248, 56, 20);
    c.fill();
    c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    c.lineWidth = 1;
    c.stroke();

    // Text
    c.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#dde';
    c.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.3, 1);
    const startY = this.parentGroup.position.y + 1.5;
    sprite.position.copy(this.parentGroup.position);
    sprite.position.y = startY;

    this.scene.add(sprite);
    this.bubbles.push({ sprite, life: 0, maxLife: 3, startY });
  }

  update(dt: number) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life += dt;

      const progress = b.life / b.maxLife;
      // Float up
      b.sprite.position.y = b.startY + progress * 0.8;
      b.sprite.position.x = this.parentGroup.position.x;
      b.sprite.position.z = this.parentGroup.position.z;

      // Fade out in last 40%
      const fadeStart = 0.6;
      if (progress > fadeStart) {
        (b.sprite.material as THREE.SpriteMaterial).opacity = 1 - (progress - fadeStart) / (1 - fadeStart);
      }

      if (b.life >= b.maxLife) {
        this.scene.remove(b.sprite);
        (b.sprite.material as THREE.SpriteMaterial).map?.dispose();
        (b.sprite.material as THREE.SpriteMaterial).dispose();
        this.bubbles.splice(i, 1);
      }
    }
  }
}
