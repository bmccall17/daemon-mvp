import * as THREE from 'three';

export class Avatar {
  group: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private nameSprite: THREE.Sprite | null = null;

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

  setNameLabel(name: string, isRealPlayer: boolean = false) {
    if (this.nameSprite) {
      this.group.remove(this.nameSprite);
      (this.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
      (this.nameSprite.material as THREE.SpriteMaterial).dispose();
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isRealPlayer) {
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#00eeff';
    } else {
      ctx.fillStyle = '#aaaaaa';
    }
    ctx.fillText(name, 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    this.nameSprite = new THREE.Sprite(mat);
    this.nameSprite.scale.set(2, 0.5, 1);
    this.nameSprite.position.y = 1.8;
    this.group.add(this.nameSprite);
  }
}
