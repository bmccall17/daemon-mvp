import * as THREE from 'three';

export function createScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

  // Camera
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 5, 10);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0x223344, 0.4);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x8899bb, 0.3);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(60, 60, 30, 30);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x111122,
    roughness: 0.9,
    metalness: 0.1,
    wireframe: false,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Grid overlay
  const gridHelper = new THREE.GridHelper(60, 60, 0x1a1a33, 0x1a1a33);
  (gridHelper.material as THREE.Material).opacity = 0.3;
  (gridHelper.material as THREE.Material).transparent = true;
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  // Ambient particles (floating dust/energy)
  const dustCount = 200;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 50;
    dustPositions[i * 3 + 1] = Math.random() * 8;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x334466,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
