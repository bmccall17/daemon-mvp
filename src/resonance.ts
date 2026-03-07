import * as THREE from 'three';
import { Daemon } from './daemon';
import { TOPIC_VECTORS, TopicId, ResonanceLink, TOPICS } from './types';

const RESONANCE_RANGE = 8.0;
const MIN_SIMILARITY = 0.3;

export interface DaemonEntry {
  id: string;
  daemon: Daemon;
  position: THREE.Vector3;
  topics: TopicId[];
}

export class ResonanceSystem {
  private scene: THREE.Scene;
  private arcs: THREE.Line[] = [];
  private mergedBeacons: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  private getBlendedVector(topics: TopicId[]): number[] {
    if (topics.length === 0) return new Array(8).fill(0);
    const result = new Array(8).fill(0);
    for (const t of topics) {
      const vec = TOPIC_VECTORS[t];
      if (vec) {
        for (let i = 0; i < 8; i++) result[i] += vec[i];
      }
    }
    const norm = 1 / topics.length;
    for (let i = 0; i < 8; i++) result[i] *= norm;
    return result;
  }

  update(entries: DaemonEntry[], time: number): ResonanceLink[] {
    // Clean up old visuals
    for (const arc of this.arcs) this.scene.remove(arc);
    for (const b of this.mergedBeacons) this.scene.remove(b);
    this.arcs = [];
    this.mergedBeacons = [];

    const links: ResonanceLink[] = [];

    // Reset all resonance
    for (const entry of entries) {
      entry.daemon.resonanceStrength = 0;
    }

    // Pairwise comparison
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i], b = entries[j];
        if (a.topics.length === 0 || b.topics.length === 0) continue;

        const dist = a.position.distanceTo(b.position);
        if (dist > RESONANCE_RANGE) continue;

        const vecA = this.getBlendedVector(a.topics);
        const vecB = this.getBlendedVector(b.topics);
        const similarity = this.cosineSimilarity(vecA, vecB);

        if (similarity < MIN_SIMILARITY) continue;

        // Strength: similarity weighted by proximity
        const proximityFactor = 1 - (dist / RESONANCE_RANGE);
        const strength = similarity * proximityFactor;

        // Find shared topics
        const sharedTopics = a.topics.filter(t => b.topics.includes(t)) as TopicId[];

        links.push({
          fromId: a.id,
          toId: b.id,
          strength,
          sharedTopics,
        });

        // Apply resonance to daemons
        a.daemon.resonanceStrength = Math.max(a.daemon.resonanceStrength, strength);
        b.daemon.resonanceStrength = Math.max(b.daemon.resonanceStrength, strength);

        // Blend resonance color
        const resColor = new THREE.Color(0.5, 0.8, 1.0);
        if (sharedTopics.length > 0) {
          // Use first shared topic color as base
          const topicData = TOPICS.find(t => t.id === sharedTopics[0]);
          if (topicData) resColor.copy(topicData.color);
        }
        a.daemon.resonanceColor.copy(resColor);
        b.daemon.resonanceColor.copy(resColor);

        // Draw energy arc between resonating daemons
        if (strength > 0.2) {
          this.drawArc(a.daemon.group.position, b.daemon.group.position, strength, resColor, time);
        }
      }
    }

    // Group amplification: find clusters of 3+
    this.findClusters(entries, links, time);

    return links;
  }

  private drawArc(
    from: THREE.Vector3,
    to: THREE.Vector3,
    strength: number,
    color: THREE.Color,
    time: number,
  ) {
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    mid.y += 0.5 + strength * 0.5;

    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const points = curve.getPoints(20);

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: strength * 0.6 * (0.7 + Math.sin(time * 3) * 0.3),
      blending: THREE.AdditiveBlending,
    });

    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.arcs.push(line);
  }

  private findClusters(entries: DaemonEntry[], links: ResonanceLink[], time: number) {
    // Simple cluster detection: group entries connected by strong links
    const adjacency = new Map<string, Set<string>>();
    for (const link of links) {
      if (link.strength < 0.3) continue;
      if (!adjacency.has(link.fromId)) adjacency.set(link.fromId, new Set());
      if (!adjacency.has(link.toId)) adjacency.set(link.toId, new Set());
      adjacency.get(link.fromId)!.add(link.toId);
      adjacency.get(link.toId)!.add(link.fromId);
    }

    // Find connected components of size 3+
    const visited = new Set<string>();
    for (const [nodeId] of adjacency) {
      if (visited.has(nodeId)) continue;

      const cluster: string[] = [];
      const queue = [nodeId];
      while (queue.length > 0) {
        const current = queue.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        cluster.push(current);
        const neighbors = adjacency.get(current);
        if (neighbors) {
          for (const n of neighbors) {
            if (!visited.has(n)) queue.push(n);
          }
        }
      }

      if (cluster.length >= 3) {
        this.createMergedBeacon(entries, cluster, time);
      }
    }
  }

  private createMergedBeacon(entries: DaemonEntry[], clusterIds: string[], time: number) {
    // Find centroid
    const centroid = new THREE.Vector3();
    let count = 0;
    const clusterEntries = entries.filter(e => clusterIds.includes(e.id));
    for (const e of clusterEntries) {
      centroid.add(e.position);
      count++;
    }
    if (count === 0) return;
    centroid.divideScalar(count);

    // Create merged beacon at centroid
    const size = 0.4 + clusterIds.length * 0.15;
    const geo = new THREE.IcosahedronGeometry(size, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.6, 0.9, 1.0),
      transparent: true,
      opacity: 0.3 + Math.sin(time * 2) * 0.1,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });

    const beacon = new THREE.Mesh(geo, mat);
    beacon.position.copy(centroid);
    beacon.position.y += 3.5;
    beacon.rotation.y = time * 0.3;
    beacon.rotation.x = Math.sin(time * 0.5) * 0.2;

    this.scene.add(beacon);
    this.mergedBeacons.push(beacon);

    // Boost resonance for cluster members
    for (const e of clusterEntries) {
      e.daemon.resonanceStrength = Math.min(1.0, e.daemon.resonanceStrength + 0.3);
    }
  }
}
