import * as THREE from 'three';

const MOVE_SPEED = 5.0;

export class PlayerControls {
  private keys: Record<string, boolean> = {};
  private mouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private yaw = 0;
  private pitch = 0.6; // looking slightly down
  private camera: THREE.PerspectiveCamera;
  private position = new THREE.Vector3(0, 0, 5);

  constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;

    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });

    canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.mouseDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.yaw -= dx * 0.003;
      this.pitch = Math.max(0.1, Math.min(1.4, this.pitch + dy * 0.003));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.mouseDown = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });
    canvas.addEventListener('touchend', () => { this.mouseDown = false; });
    canvas.addEventListener('touchmove', (e) => {
      if (!this.mouseDown || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.yaw -= dx * 0.003;
      this.pitch = Math.max(0.1, Math.min(1.4, this.pitch + dy * 0.003));
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    });
  }

  update(dt: number): THREE.Vector3 {
    // Movement relative to camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const move = new THREE.Vector3();
    if (this.keys['w'] || this.keys['arrowup']) move.add(forward);
    if (this.keys['s'] || this.keys['arrowdown']) move.sub(forward);
    if (this.keys['a'] || this.keys['arrowleft']) move.sub(right);
    if (this.keys['d'] || this.keys['arrowright']) move.add(right);

    if (move.length() > 0) {
      move.normalize().multiplyScalar(MOVE_SPEED * dt);
      this.position.add(move);
    }

    // Clamp to arena
    this.position.x = Math.max(-25, Math.min(25, this.position.x));
    this.position.z = Math.max(-25, Math.min(25, this.position.z));

    // Update camera (third person follow)
    const camDist = 6;
    const camX = this.position.x + Math.sin(this.yaw) * camDist * Math.cos(this.pitch);
    const camY = this.position.y + camDist * Math.sin(this.pitch) + 1;
    const camZ = this.position.z + Math.cos(this.yaw) * camDist * Math.cos(this.pitch);
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.position.x, this.position.y + 1.2, this.position.z);

    return this.position.clone();
  }
}
