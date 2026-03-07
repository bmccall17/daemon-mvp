import * as THREE from 'three';
import { SocialState, SOCIAL_STATE_CONFIG, TopicId, TOPICS } from './types';

const PARTICLE_COUNT = 120;
const FOLLOW_SPEED = 3.0;
const FOLLOW_DAMPING = 0.92;

export class Daemon {
  group: THREE.Group;
  private particles: THREE.Points;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private particleColors: Float32Array;
  private particleSizes: Float32Array;
  private coreMesh: THREE.Mesh;
  private glowMesh: THREE.Mesh;
  private beaconGroup: THREE.Group;
  private beaconMesh: THREE.Mesh;
  private beaconGlow: THREE.Mesh;

  private targetPosition = new THREE.Vector3();
  private velocity = new THREE.Vector3();
  private currentState: SocialState = SocialState.OPEN;
  private targetConfig = SOCIAL_STATE_CONFIG[SocialState.OPEN];
  private lerpedSpread = 1.2;
  private lerpedPulse = 1.0;
  private lerpedBrightness = 0.9;
  private lerpedOrbit = 1.5;
  private lerpedColor = new THREE.Color(0.9, 0.7, 0.3);

  private topics: TopicId[] = [];
  private breathPhase = Math.random() * Math.PI * 2;
  private curiosityTimer = 0;
  private curiosityOffset = new THREE.Vector3();

  // Resonance state (set externally)
  resonanceStrength = 0;
  resonanceColor = new THREE.Color(1, 1, 1);

  constructor() {
    this.group = new THREE.Group();

    // Core glowing orb
    const coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0.9,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreMesh);

    // Soft glow around core
    const glowGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glowMesh);

    // Particle cloud
    this.particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    this.particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    this.particleColors = new Float32Array(PARTICLE_COUNT * 3);
    this.particleSizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.3 + Math.random() * 0.5;
      this.particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      this.particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      this.particlePositions[i * 3 + 2] = r * Math.cos(phi);

      this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
      this.particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      this.particleColors[i * 3] = 0.9;
      this.particleColors[i * 3 + 1] = 0.7;
      this.particleColors[i * 3 + 2] = 0.3;

      this.particleSizes[i] = 2 + Math.random() * 3;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(this.particleSizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(particleGeo, particleMat);
    this.group.add(this.particles);

    // Beacon (topic projection above avatar)
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.position.y = 2.5;
    this.beaconGroup.visible = false;

    const beaconGeo = new THREE.OctahedronGeometry(0.2, 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconGroup.add(this.beaconMesh);

    const beaconGlowGeo = new THREE.OctahedronGeometry(0.35, 0);
    const beaconGlowMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    this.beaconGlow = new THREE.Mesh(beaconGlowGeo, beaconGlowMat);
    this.beaconGroup.add(this.beaconGlow);

    this.group.add(this.beaconGroup);
  }

  setState(state: SocialState) {
    this.currentState = state;
    this.targetConfig = SOCIAL_STATE_CONFIG[state];
  }

  getState(): SocialState {
    return this.currentState;
  }

  setTopics(topics: TopicId[]) {
    this.topics = topics;
    this.beaconGroup.visible = topics.length > 0;

    if (topics.length > 0) {
      // Blend topic colors for beacon
      const blended = new THREE.Color(0, 0, 0);
      for (const topicId of topics) {
        const topic = TOPICS.find(t => t.id === topicId);
        if (topic) blended.add(topic.color);
      }
      blended.multiplyScalar(1 / topics.length);
      (this.beaconMesh.material as THREE.MeshBasicMaterial).color.copy(blended);
      (this.beaconGlow.material as THREE.MeshBasicMaterial).color.copy(blended);
    }
  }

  getTopics(): TopicId[] {
    return this.topics;
  }

  setFollowTarget(pos: THREE.Vector3) {
    this.targetPosition.copy(pos);
    // Offset to float beside and above avatar
    this.targetPosition.x += Math.sin(this.breathPhase * 0.3) * 0.3;
    this.targetPosition.y += 1.8;
    this.targetPosition.z += Math.cos(this.breathPhase * 0.3) * 0.3;
  }

  update(dt: number) {
    const t = this.breathPhase;

    // Lerp visual properties toward target state
    const lerpRate = dt * 2.0;
    this.lerpedSpread += (this.targetConfig.particleSpread - this.lerpedSpread) * lerpRate;
    this.lerpedPulse += (this.targetConfig.pulseSpeed - this.lerpedPulse) * lerpRate;
    this.lerpedBrightness += (this.targetConfig.brightness - this.lerpedBrightness) * lerpRate;
    this.lerpedOrbit += (this.targetConfig.orbitRadius - this.lerpedOrbit) * lerpRate;
    this.lerpedColor.lerp(this.targetConfig.color, lerpRate);

    // If resonating, blend toward resonance color
    if (this.resonanceStrength > 0) {
      this.lerpedColor.lerp(this.resonanceColor, this.resonanceStrength * 0.4);
      this.lerpedBrightness += this.resonanceStrength * 0.5;
    }

    // Follow target with spring physics
    const diff = new THREE.Vector3().subVectors(this.targetPosition, this.group.position);
    this.velocity.add(diff.multiplyScalar(FOLLOW_SPEED * dt));
    this.velocity.multiplyScalar(FOLLOW_DAMPING);
    this.group.position.add(this.velocity.clone().multiplyScalar(dt * 60));

    // Breathing
    this.breathPhase += dt * this.lerpedPulse;
    const breathScale = 1 + Math.sin(this.breathPhase) * 0.08;
    this.coreMesh.scale.setScalar(breathScale);
    this.glowMesh.scale.setScalar(breathScale * 1.2);

    // Curiosity micro-movements
    this.curiosityTimer += dt;
    if (this.curiosityTimer > 2 + Math.random() * 3) {
      this.curiosityTimer = 0;
      this.curiosityOffset.set(
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.15,
      );
    }
    this.coreMesh.position.lerp(this.curiosityOffset, dt * 2);

    // Update core color
    const coreColor = this.lerpedColor.clone().multiplyScalar(this.lerpedBrightness);
    (this.coreMesh.material as THREE.MeshBasicMaterial).color.copy(coreColor);
    (this.glowMesh.material as THREE.MeshBasicMaterial).color.copy(this.lerpedColor);
    (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.1 + this.lerpedBrightness * 0.1;

    // Update particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

      // Orbit and drift
      const px = this.particlePositions[ix];
      const py = this.particlePositions[iy];
      const pz = this.particlePositions[iz];
      const dist = Math.sqrt(px * px + py * py + pz * pz);

      // Pull toward orbit radius
      const targetDist = this.lerpedSpread * (0.3 + (i / PARTICLE_COUNT) * 0.7);
      const pullStrength = (targetDist - dist) * 0.5;
      if (dist > 0.001) {
        this.particleVelocities[ix] += (px / dist) * pullStrength * dt;
        this.particleVelocities[iy] += (py / dist) * pullStrength * dt;
        this.particleVelocities[iz] += (pz / dist) * pullStrength * dt;
      }

      // Gentle orbital motion
      this.particleVelocities[ix] += (-pz * 0.3 + (Math.random() - 0.5) * 0.1) * dt;
      this.particleVelocities[iz] += (px * 0.3 + (Math.random() - 0.5) * 0.1) * dt;
      this.particleVelocities[iy] += (Math.random() - 0.5) * 0.05 * dt;

      // Damping
      this.particleVelocities[ix] *= 0.98;
      this.particleVelocities[iy] *= 0.98;
      this.particleVelocities[iz] *= 0.98;

      // Integrate
      this.particlePositions[ix] += this.particleVelocities[ix];
      this.particlePositions[iy] += this.particleVelocities[iy];
      this.particlePositions[iz] += this.particleVelocities[iz];

      // Color
      this.particleColors[ix] = this.lerpedColor.r * (0.7 + Math.sin(t + i * 0.3) * 0.3);
      this.particleColors[iy] = this.lerpedColor.g * (0.7 + Math.sin(t + i * 0.3 + 1) * 0.3);
      this.particleColors[iz] = this.lerpedColor.b * (0.7 + Math.sin(t + i * 0.3 + 2) * 0.3);

      // Resonance sparkle
      if (this.resonanceStrength > 0.3) {
        const sparkle = Math.sin(t * 5 + i * 0.7) * this.resonanceStrength;
        this.particleColors[ix] += sparkle * 0.3;
        this.particleColors[iy] += sparkle * 0.3;
        this.particleColors[iz] += sparkle * 0.3;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;

    // Beacon animation
    if (this.beaconGroup.visible) {
      this.beaconMesh.rotation.y += dt * 0.8;
      this.beaconMesh.rotation.x = Math.sin(t * 0.5) * 0.2;
      const beaconScale = 1 + Math.sin(t * 1.5) * 0.15;
      this.beaconMesh.scale.setScalar(beaconScale);
      this.beaconGlow.scale.setScalar(beaconScale * 1.3);

      // Beacon gets bigger with resonance
      if (this.resonanceStrength > 0) {
        const boost = 1 + this.resonanceStrength * 0.8;
        this.beaconMesh.scale.multiplyScalar(boost);
        this.beaconGlow.scale.multiplyScalar(boost);
      }
    }
  }
}
