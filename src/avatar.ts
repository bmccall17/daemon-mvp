import * as THREE from 'three';

export class Avatar {
  group: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;

  constructor(color: number = 0x888899) {
    this.group = new THREE.Group();

    // Body (capsule-like: cylinder + spheres)
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.0, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.7;
    this.group.add(this.body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.1,
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 1.4;
    this.group.add(this.head);
  }

  setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }

  getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }
}
