import * as THREE from 'three';
import { SocialState, SOCIAL_STATE_CONFIG, TopicId, TOPICS } from './types';
import { FormId, FormContext, getFormById } from './form-selector';

const FOLLOW_SPEED = 3.0;
const FOLLOW_DAMPING = 0.92;

export class Daemon {
  group: THREE.Group;
  private formGroup: THREE.Group;
  private beaconGroup: THREE.Group;
  private beaconMesh: THREE.Mesh;
  private beaconGlow: THREE.Mesh;

  private formId: FormId = 'wisp';
  private formUpdateFn: ((t: number, dt: number, ctx?: FormContext) => void) | null = null;
  private formTime = 0;

  private targetPosition = new THREE.Vector3();
  private velocity = new THREE.Vector3();
  private currentState: SocialState = SocialState.OPEN;
  private targetConfig = SOCIAL_STATE_CONFIG[SocialState.OPEN];
  private lerpedBrightness = 0.9;
  private lerpedColor = new THREE.Color(0.9, 0.7, 0.3);

  private topics: TopicId[] = [];
  private breathPhase = Math.random() * Math.PI * 2;

  // Resonance state (set externally)
  resonanceStrength = 0;
  resonanceColor = new THREE.Color(1, 1, 1);
  nearbyDirection: THREE.Vector3 | null = null;
  nearbyDistance = Infinity;
  excitementLevel = 0;

  constructor() {
    this.group = new THREE.Group();

    // Form visuals container
    this.formGroup = new THREE.Group();
    this.group.add(this.formGroup);

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

    // Build default form
    this.setForm('wisp');
  }

  setForm(formId: FormId) {
    const formDef = getFormById(formId);
    if (!formDef) return;

    // Dispose old form visuals
    this.disposeGroup(this.formGroup);

    this.formId = formId;
    this.formUpdateFn = formDef.build(this.formGroup);
    this.formTime = 0;
  }

  getFormId(): FormId {
    return this.formId;
  }

  private disposeGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line || child instanceof THREE.LineSegments) {
        child.geometry?.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else if (mat) {
          mat.dispose();
        }
      }
    }
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
    this.targetPosition.x += Math.sin(this.breathPhase * 0.3) * 0.3;
    this.targetPosition.y += 1.8;
    this.targetPosition.z += Math.cos(this.breathPhase * 0.3) * 0.3;
  }

  toSerializable(): { formId: FormId; socialState: SocialState; topics: TopicId[]; position: { x: number; y: number; z: number } } {
    return {
      formId: this.formId,
      socialState: this.currentState,
      topics: [...this.topics],
      position: {
        x: this.group.position.x,
        y: this.group.position.y,
        z: this.group.position.z,
      },
    };
  }

  update(dt: number) {
    const t = this.breathPhase;

    // Lerp visual properties toward target state
    const lerpRate = dt * 2.0;
    this.lerpedBrightness += (this.targetConfig.brightness - this.lerpedBrightness) * lerpRate;
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
    this.breathPhase += dt * 1.0;

    // Run the form's procedural animation with resonance context
    this.formTime += dt;
    if (this.formUpdateFn) {
      const ctx: FormContext = {
        resonanceStrength: this.resonanceStrength,
        resonanceColor: this.resonanceColor,
        nearbyDirection: this.nearbyDirection,
        nearbyDistance: this.nearbyDistance,
        excitementLevel: this.excitementLevel,
      };
      this.formUpdateFn(this.formTime, dt, ctx);
    }

    // Beacon animation
    if (this.beaconGroup.visible) {
      this.beaconMesh.rotation.y += dt * 0.8;
      this.beaconMesh.rotation.x = Math.sin(t * 0.5) * 0.2;
      const beaconScale = 1 + Math.sin(t * 1.5) * 0.15;
      this.beaconMesh.scale.setScalar(beaconScale);
      this.beaconGlow.scale.setScalar(beaconScale * 1.3);

      if (this.resonanceStrength > 0) {
        const boost = 1 + this.resonanceStrength * 0.8;
        this.beaconMesh.scale.multiplyScalar(boost);
        this.beaconGlow.scale.multiplyScalar(boost);
      }
    }
  }
}
