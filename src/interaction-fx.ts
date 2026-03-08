import * as THREE from 'three';
import { ResonanceLink } from './types';
import { DaemonEntry } from './resonance';

const POOL_SIZE = 6;
const PARTICLE_COUNT = 40;
const MIN_STRENGTH = 0.4;

interface FXSlot {
  points: THREE.Points;
  positions: Float32Array;
  colors: Float32Array;
  geo: THREE.BufferGeometry;
  active: boolean;
  phases: Float32Array;
}

export class InteractionFXSystem {
  private pool: FXSlot[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    for (let i = 0; i < POOL_SIZE; i++) {
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);
      const phases = new Float32Array(PARTICLE_COUNT);
      for (let p = 0; p < PARTICLE_COUNT; p++) phases[p] = Math.random() * Math.PI * 2;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const points = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.035,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }));
      points.visible = false;
      scene.add(points);

      this.pool.push({ points, positions, colors, geo, active: false, phases });
    }
  }

  update(entries: DaemonEntry[], links: ResonanceLink[], time: number) {
    // Deactivate all
    for (const slot of this.pool) {
      slot.active = false;
      slot.points.visible = false;
    }

    // Find strong links and map to entries
    const entryMap = new Map<string, DaemonEntry>();
    for (const e of entries) entryMap.set(e.id, e);

    let slotIdx = 0;
    for (const link of links) {
      if (link.strength < MIN_STRENGTH || slotIdx >= POOL_SIZE) continue;

      const a = entryMap.get(link.fromId);
      const b = entryMap.get(link.toId);
      if (!a || !b) continue;

      const slot = this.pool[slotIdx++];
      slot.active = true;
      slot.points.visible = true;

      const mid = new THREE.Vector3().addVectors(
        a.daemon.group.position, b.daemon.group.position
      ).multiplyScalar(0.5);

      const color = a.daemon.resonanceColor;
      const str = link.strength;

      for (let p = 0; p < PARTICLE_COUNT; p++) {
        const phase = slot.phases[p] + time * 2;
        const r = 0.1 + Math.sin(phase * 0.7) * 0.15 * str;
        const ix = p * 3;
        slot.positions[ix] = mid.x + Math.cos(phase) * r;
        slot.positions[ix + 1] = mid.y + Math.sin(phase * 1.3) * r * 0.5;
        slot.positions[ix + 2] = mid.z + Math.sin(phase) * r;

        const fade = 0.5 + Math.sin(phase * 2) * 0.3;
        slot.colors[ix] = color.r * fade;
        slot.colors[ix + 1] = color.g * fade;
        slot.colors[ix + 2] = color.b * fade;
      }

      slot.geo.attributes.position.needsUpdate = true;
      slot.geo.attributes.color.needsUpdate = true;
      (slot.points.material as THREE.PointsMaterial).opacity = str * 0.6;
    }
  }

  dispose() {
    for (const slot of this.pool) {
      this.scene.remove(slot.points);
      slot.geo.dispose();
      (slot.points.material as THREE.PointsMaterial).dispose();
    }
  }
}
