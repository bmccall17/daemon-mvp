import * as THREE from 'three';

export type FormId = 'wisp' | 'ember' | 'tide' | 'lattice' | 'murmur' | 'phantom' | 'pulse' | 'sigil';

export interface FormContext {
  resonanceStrength: number;       // 0..1
  resonanceColor: THREE.Color;
  nearbyDirection: THREE.Vector3 | null;  // toward nearest resonating daemon
  nearbyDistance: number;          // Infinity if none
  excitementLevel: number;        // 0..1, from tone input
}

export interface DaemonFormDef {
  id: FormId;
  name: string;
  archetype: string;
  desc: string;
  build: (parent: THREE.Object3D) => (t: number, dt: number, ctx?: FormContext) => void;
}

export type FormChangeCallback = (formId: FormId) => void;

// ── Form definitions (procedural builders) ──

const FORMS: DaemonFormDef[] = [
  {
    id: 'wisp',
    name: 'Wisp',
    archetype: 'the nebulous',
    desc: 'Gaseous cloud. Dissolving and reforming. Still becoming.',
    build: (scene) => {
      const count = 150;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const velocities: THREE.Vector3[] = [];
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.2 + Math.random() * 0.6;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        colors[i * 3] = 0.6 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.3 + Math.random() * 0.2;
        velocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.003));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.05, vertexColors: true, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      })));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshStandardMaterial({ color: 0xddaa55, emissive: 0xddaa55, emissiveIntensity: 2, transparent: true, opacity: 0.8 }));
      scene.add(core);
      return (t, _dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        const spread = 0.5 + rs * 0.4; // cloud elongates when resonating
        for (let i = 0; i < count; i++) {
          const ix = i * 3;
          const d = Math.sqrt(positions[ix] ** 2 + positions[ix + 1] ** 2 + positions[ix + 2] ** 2);
          const pull = (spread - d) * 0.01;
          if (d > 0.01) { positions[ix] += (positions[ix] / d) * pull + velocities[i].x; positions[ix + 1] += (positions[ix + 1] / d) * pull + velocities[i].y; positions[ix + 2] += (positions[ix + 2] / d) * pull + velocities[i].z; }
          positions[ix] += -positions[ix + 2] * 0.002; positions[ix + 2] += positions[ix] * 0.002;
          // Drift toward neighbor
          if (rs > 0 && dir) {
            const drift = rs * 0.003;
            positions[ix] += dir.x * drift; positions[ix + 1] += dir.y * drift; positions[ix + 2] += dir.z * drift;
          }
        }
        geo.attributes.position.needsUpdate = true;
        core.scale.setScalar(1 + Math.sin(t * 1.2) * 0.1 + rs * 0.2);
      };
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    archetype: 'the burning',
    desc: 'Sparks rising from a hot core. Perpetually igniting.',
    build: (scene) => {
      const count = 200;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const lifetimes = new Float32Array(count);
      const speeds = new Float32Array(count);
      for (let i = 0; i < count; i++) { lifetimes[i] = Math.random(); speeds[i] = 0.3 + Math.random() * 0.7; }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.04, vertexColors: true, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      })));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff6622, emissive: 0xff6622, emissiveIntensity: 2, transparent: true, opacity: 0.9 }));
      scene.add(core);
      return (t, dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        const speedMult = 1 + rs * 0.8; // faster sparks when resonating
        for (let i = 0; i < count; i++) {
          lifetimes[i] += dt * speeds[i] * 0.5 * speedMult;
          if (lifetimes[i] > 1) { lifetimes[i] = 0; const a = Math.random() * Math.PI * 2; const r = Math.random() * 0.08; positions[i * 3] = Math.cos(a) * r; positions[i * 3 + 1] = 0; positions[i * 3 + 2] = Math.sin(a) * r; }
          positions[i * 3] += Math.sin(t * 2 + i * 0.5) * 0.002;
          positions[i * 3 + 1] += dt * speeds[i] * 0.8;
          positions[i * 3 + 2] += Math.cos(t * 2 + i * 0.5) * 0.002;
          // Arc sparks sideways toward neighbor
          if (rs > 0 && dir) {
            const arc = rs * 0.004 * (1 - lifetimes[i]);
            positions[i * 3] += dir.x * arc; positions[i * 3 + 2] += dir.z * arc;
          }
          const l = lifetimes[i]; colors[i * 3] = 1 * (1 - l * 0.3); colors[i * 3 + 1] = 0.4 * (1 - l * 0.8); colors[i * 3 + 2] = 0.1 * (1 - l);
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        core.scale.setScalar(1 + Math.sin(t * 3) * 0.15 + rs * 0.25);
      };
    },
  },
  {
    id: 'tide',
    name: 'Tide',
    archetype: 'the flowing',
    desc: 'Aurora ribbons in sinuous arcs. Calm, deep, rhythmic.',
    build: (scene) => {
      const ribbons: { positions: Float32Array; colors: Float32Array; geo: THREE.BufferGeometry; phase: number; radius: number; hue: number }[] = [];
      const hues = [0.55, 0.6, 0.65, 0.5, 0.7];
      for (let r = 0; r < 5; r++) {
        const pts = 50;
        const positions = new Float32Array(pts * 3);
        const colors = new Float32Array(pts * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })));
        ribbons.push({ positions, colors, geo, phase: r * 1.3, radius: 0.35 + r * 0.1, hue: hues[r] });
      }
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshStandardMaterial({ color: 0x44aacc, emissive: 0x44aacc, emissiveIntensity: 2, transparent: true, opacity: 0.8 }));
      scene.add(core);
      return (t, _dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        const ampBoost = 1 + rs * 0.8; // amplitude increases
        for (const rib of ribbons) {
          const pts = rib.positions.length / 3;
          for (let i = 0; i < pts; i++) {
            const f = i / pts, angle = f * Math.PI * 3 + t * 0.8 + rib.phase;
            const r = rib.radius * (0.7 + Math.sin(t * 0.5 + f * 4 + rib.phase) * 0.3 * ampBoost);
            let px = Math.cos(angle) * r;
            let py = Math.sin(f * Math.PI * 2 + t * 0.6 + rib.phase) * 0.4 * ampBoost;
            let pz = Math.sin(angle) * r;
            // Lean toward neighbor
            if (rs > 0 && dir) {
              const lean = rs * 0.15 * f;
              px += dir.x * lean; pz += dir.z * lean;
            }
            rib.positions[i * 3] = px; rib.positions[i * 3 + 1] = py; rib.positions[i * 3 + 2] = pz;
            const c = new THREE.Color().setHSL(rib.hue + f * 0.1, 0.7, 0.4 + f * 0.2 + rs * 0.15);
            rib.colors[i * 3] = c.r; rib.colors[i * 3 + 1] = c.g; rib.colors[i * 3 + 2] = c.b;
          }
          rib.geo.attributes.position.needsUpdate = true; rib.geo.attributes.color.needsUpdate = true;
        }
        core.scale.setScalar(1 + Math.sin(t) * 0.1 + rs * 0.15);
      };
    },
  },
  {
    id: 'lattice',
    name: 'Lattice',
    archetype: 'the crystalline',
    desc: 'Nested rotating wireframe solids. Mathematical precision that breathes.',
    build: (scene) => {
      const geos = [new THREE.IcosahedronGeometry(0.4, 0), new THREE.OctahedronGeometry(0.4, 0), new THREE.TetrahedronGeometry(0.4, 0)];
      const shellColors = [0x6688ff, 0x8866ff, 0x66ffaa];
      const shells: THREE.Mesh[] = [];
      const scales = [0.5, 0.8, 1.1];
      for (let i = 0; i < 3; i++) {
        const mesh = new THREE.Mesh(geos[i], new THREE.MeshStandardMaterial({ color: shellColors[i], emissive: shellColors[i], emissiveIntensity: 1, wireframe: true, transparent: true, opacity: 0.6 - i * 0.1, blending: THREE.AdditiveBlending }));
        mesh.scale.setScalar(scales[i]);
        scene.add(mesh); shells.push(mesh);
      }
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xaabbff, emissive: 0xaabbff, emissiveIntensity: 2, transparent: true, opacity: 0.9 }));
      scene.add(core);
      return (t, _dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        const b = 1 + Math.sin(t * 0.8) * 0.08;
        const expand = 1 + rs * 0.4; // shells expand
        const spinBoost = 1 + rs * 1.5; // rotation accelerates
        shells[0].rotation.set(Math.sin(t * 0.2) * 0.3, t * 0.3 * spinBoost, 0); shells[0].scale.setScalar(scales[0] * b * expand);
        shells[1].rotation.set(0, -t * 0.2 * spinBoost, t * 0.15 * spinBoost); shells[1].scale.setScalar(scales[1] * b * expand);
        shells[2].rotation.set(t * 0.25 * spinBoost, t * 0.1 * spinBoost, 0); shells[2].scale.setScalar(scales[2] * b * expand);
        // Outermost shell pulls toward neighbor
        if (rs > 0 && dir) {
          shells[2].position.set(dir.x * rs * 0.15, dir.y * rs * 0.1, dir.z * rs * 0.15);
        } else {
          shells[2].position.set(0, 0, 0);
        }
        core.scale.setScalar(b + rs * 0.1);
      };
    },
  },
  {
    id: 'murmur',
    name: 'Murmur',
    archetype: 'the swarming',
    desc: 'A flock of motes moving as one. Collective intelligence.',
    build: (scene) => {
      const count = 300;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const vels: THREE.Vector3[] = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1; positions[i * 3 + 1] = (Math.random() - 0.5) * 1; positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
        vels.push(new THREE.Vector3((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.025, vertexColors: true, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      })));
      return (t, _dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        // Shift attractor toward neighbor
        let ax = Math.sin(t * 0.4) * 0.35, ay = Math.cos(t * 0.3) * 0.25, az = Math.sin(t * 0.5) * 0.35;
        if (rs > 0 && dir) {
          ax += dir.x * rs * 0.3; ay += dir.y * rs * 0.2; az += dir.z * rs * 0.3;
        }
        const speedMult = 1 + rs * 1.0; // speed increases
        const maxSpeed = 0.015 * speedMult;
        for (let i = 0; i < count; i++) {
          const ix = i * 3;
          const dx = ax - positions[ix], dy = ay - positions[ix + 1], dz = az - positions[ix + 2];
          vels[i].x += dx * 0.0005 * speedMult; vels[i].y += dy * 0.0005 * speedMult; vels[i].z += dz * 0.0005 * speedMult;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < 0.15 && d > 0.001) { vels[i].x -= dx / d * 0.001; vels[i].y -= dy / d * 0.001; vels[i].z -= dz / d * 0.001; }
          const sp = vels[i].length(); if (sp > maxSpeed) vels[i].multiplyScalar(maxSpeed / sp);
          vels[i].x += -positions[ix + 2] * 0.0003; vels[i].z += positions[ix] * 0.0003;
          positions[ix] += vels[i].x; positions[ix + 1] += vels[i].y; positions[ix + 2] += vels[i].z;
          const c = new THREE.Color().setHSL(0.3 + Math.sin(t * 0.5 + i * 0.01) * 0.1, 0.6, 0.5 + rs * 0.2);
          colors[ix] = c.r; colors[ix + 1] = c.g; colors[ix + 2] = c.b;
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      };
    },
  },
  {
    id: 'phantom',
    name: 'Phantom',
    archetype: 'the veiled',
    desc: 'Translucent ghostly form. Billowing. Barely there. Always watching.',
    build: (scene) => {
      const geo = new THREE.SphereGeometry(0.4, 16, 16);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8888cc, emissive: 0x8888cc, emissiveIntensity: 0.5, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      scene.add(mesh);
      const wire = new THREE.Mesh(geo.clone(), new THREE.MeshStandardMaterial({ color: 0x6666aa, emissive: 0x6666aa, emissiveIntensity: 1, transparent: true, opacity: 0.6, wireframe: true, blending: THREE.AdditiveBlending }));
      scene.add(wire);
      const basePos = geo.attributes.position.array.slice();
      const eyeGeo = new THREE.SphereGeometry(0.025, 6, 6);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xccccff, emissive: 0xccccff, emissiveIntensity: 2, transparent: true, opacity: 0.9 });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.08, 0.12, 0.34); scene.add(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat.clone()); eyeR.position.set(0.08, 0.12, 0.34); scene.add(eyeR);
      return (t, _dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        const billowMult = 1 + rs * 1.5; // billowing intensifies
        const pos = geo.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length; i += 3) {
          const w = (Math.sin(basePos[i + 1] * 4 + t * 1.5) * 0.04 + Math.sin(basePos[i] * 3 + t * 1.2) * 0.025) * billowMult;
          pos[i] = basePos[i] + w; pos[i + 1] = basePos[i + 1] + Math.sin(t * 0.8 + basePos[i] * 2) * 0.025 * billowMult; pos[i + 2] = basePos[i + 2] + w * 0.5;
        }
        geo.attributes.position.needsUpdate = true;
        wire.geometry.attributes.position.array.set(pos); wire.geometry.attributes.position.needsUpdate = true;
        // Opacity increases with resonance
        (mesh.material as THREE.MeshStandardMaterial).opacity = 0.3 + rs * 0.3;
        mesh.rotation.y = Math.sin(t * 0.3) * 0.1; wire.rotation.y = mesh.rotation.y;
        // Eyes look toward neighbor
        let gx = Math.sin(t * 0.4) * 0.025, gy = Math.cos(t * 0.3) * 0.015;
        if (rs > 0 && dir) {
          gx += dir.x * rs * 0.05; gy += dir.y * rs * 0.03;
        }
        eyeL.position.set(-0.08 + gx, 0.12 + gy, 0.34); eyeR.position.set(0.08 + gx, 0.12 + gy, 0.34);
        const blink = Math.sin(t * 0.7); eyeL.scale.y = blink > 0.95 ? 0.1 : 1; eyeR.scale.y = blink > 0.95 ? 0.1 : 1;
      };
    },
  },
  {
    id: 'pulse',
    name: 'Pulse',
    archetype: 'the radiating',
    desc: 'Expanding rings. A heartbeat made visible. Energy fills the room.',
    build: (scene) => {
      const rings: { mesh: THREE.Mesh; phase: number; mat: THREE.MeshStandardMaterial }[] = [];
      for (let i = 0; i < 6; i++) {
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.8 + i * 0.03, 0.7, 0.5), emissive: new THREE.Color().setHSL(0.8 + i * 0.03, 0.7, 0.5), emissiveIntensity: 1, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
        const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.006, 8, 32), mat);
        mesh.rotation.x = Math.PI / 2; scene.add(mesh);
        rings.push({ mesh, phase: i * 0.4, mat });
      }
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff66aa, emissive: 0xff66aa, emissiveIntensity: 2, transparent: true, opacity: 0.9 }));
      scene.add(core);
      return (t, _dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        const emitSpeed = 0.5 + rs * 0.5; // ring emission rate doubles at full resonance
        for (const ring of rings) {
          const life = ((t * emitSpeed + ring.phase) % 2) / 2;
          const s = 1 + life * 7; ring.mesh.scale.set(s, s, 1); ring.mat.opacity = (1 - life) * (0.5 + rs * 0.3);
          ring.mesh.position.y = Math.sin(t * 0.5) * 0.08;
          // Rings tilt toward neighbor
          let tiltX = Math.PI / 2 + Math.sin(t * 0.3) * 0.15;
          let tiltZ = 0;
          if (rs > 0 && dir) {
            tiltX += dir.z * rs * 0.3;
            tiltZ += dir.x * rs * 0.3;
          }
          ring.mesh.rotation.x = tiltX; ring.mesh.rotation.z = tiltZ;
        }
        const beat = Math.pow(Math.max(0, Math.sin(t * 3)), 8);
        core.scale.setScalar(1 + beat * 0.4 + rs * 0.2);
      };
    },
  },
  {
    id: 'sigil',
    name: 'Sigil',
    archetype: 'the symbolic',
    desc: 'Orbiting glyphs in shifting constellations. A living language.',
    build: (scene) => {
      const glyphCount = 10;
      const glyphs: { mesh: THREE.Mesh; orbit: number; speed: number; phase: number; tilt: number }[] = [];
      const shapes = [() => new THREE.TorusGeometry(0.03, 0.005, 6, 12), () => new THREE.ConeGeometry(0.03, 0.05, 3), () => new THREE.OctahedronGeometry(0.03, 0), () => new THREE.BoxGeometry(0.04, 0.008, 0.008)];
      for (let i = 0; i < glyphCount; i++) {
        const mesh = new THREE.Mesh(shapes[i % 4](), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.1 + (i / glyphCount) * 0.15, 0.6, 0.6), emissive: new THREE.Color().setHSL(0.1 + (i / glyphCount) * 0.15, 0.6, 0.6), emissiveIntensity: 1, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
        scene.add(mesh);
        glyphs.push({ mesh, orbit: 0.3 + Math.random() * 0.25, speed: 0.3 + Math.random() * 0.4, phase: i * 0.6, tilt: Math.random() * 0.5 });
      }
      const linePos = new Float32Array(glyphCount * 2 * 3);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
      scene.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xaa8844, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending })));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshStandardMaterial({ color: 0xddaa44, emissive: 0xddaa44, emissiveIntensity: 2, transparent: true, opacity: 0.9 }));
      scene.add(core);
      return (t, _dt, ctx) => {
        const rs = ctx?.resonanceStrength ?? 0;
        const dir = ctx?.nearbyDirection;
        const orbitWiden = 1 + rs * 0.5; // orbits widen
        for (let i = 0; i < glyphs.length; i++) {
          const g = glyphs[i], angle = t * g.speed + g.phase;
          const orbit = g.orbit * orbitWiden;
          g.mesh.position.set(Math.cos(angle) * orbit, Math.sin(angle * 0.7 + g.tilt) * 0.25, Math.sin(angle) * orbit);
          g.mesh.rotation.set(0, t * 0.5, t * 0.3 + i);
          // Nearest glyphs glow brighter when resonating
          let glowBoost = 0;
          if (rs > 0 && dir) {
            const dot = g.mesh.position.x * dir.x + g.mesh.position.z * dir.z;
            glowBoost = Math.max(0, dot) * rs * 0.4;
          }
          (g.mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 1.5 + i) * 0.3 + glowBoost;
          const ni = (i + 1) % glyphs.length;
          linePos[i * 6] = g.mesh.position.x; linePos[i * 6 + 1] = g.mesh.position.y; linePos[i * 6 + 2] = g.mesh.position.z;
          linePos[i * 6 + 3] = glyphs[ni].mesh.position.x; linePos[i * 6 + 4] = glyphs[ni].mesh.position.y; linePos[i * 6 + 5] = glyphs[ni].mesh.position.z;
        }
        lineGeo.attributes.position.needsUpdate = true;
        core.scale.setScalar(1 + Math.sin(t * 0.9) * 0.1 + rs * 0.15);
      };
    },
  },
];

// ── UI Builder ──

export function initFormSelector(onFormChange: FormChangeCallback) {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #form-toggle {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 30;
      padding: 8px 14px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      background: rgba(10,10,15,0.8);
      color: #aab;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s;
      backdrop-filter: blur(10px);
      letter-spacing: 0.05em;
    }
    #form-toggle:hover { border-color: rgba(255,255,255,0.5); color: #fff; }
    #form-toggle.open { border-color: #7799cc; color: #7799cc; }

    .form-drawer {
      position: fixed;
      top: 0;
      height: 100%;
      width: 200px;
      z-index: 25;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
      padding: 20px 10px;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
      pointer-events: none;
      opacity: 0;
    }
    .form-drawer.open { pointer-events: all; opacity: 1; }
    .form-drawer.left { left: 0; transform: translateX(-100%); }
    .form-drawer.right { right: 0; transform: translateX(100%); }
    .form-drawer.left.open { transform: translateX(0); }
    .form-drawer.right.open { transform: translateX(0); }

    .form-card {
      background: rgba(10, 10, 20, 0.85);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;
      backdrop-filter: blur(12px);
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .form-card:hover {
      border-color: rgba(255,255,255,0.25);
      background: rgba(15, 15, 30, 0.9);
    }
    .form-card.selected {
      border-color: #7799cc;
      box-shadow: 0 0 12px rgba(119, 153, 204, 0.2);
    }
    .form-card canvas {
      width: 100%;
      flex: 1;
      min-height: 0;
      display: block;
    }
    .form-card-label {
      padding: 6px 10px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .form-card-name {
      font-size: 12px;
      color: #aab;
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    .form-card-arch {
      font-size: 10px;
      color: #556;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);

  // Toggle button
  const toggle = document.createElement('button');
  toggle.id = 'form-toggle';
  toggle.textContent = 'form';
  document.body.appendChild(toggle);

  // Left drawer (first 4)
  const leftDrawer = document.createElement('div');
  leftDrawer.className = 'form-drawer left';
  document.body.appendChild(leftDrawer);

  // Right drawer (last 4)
  const rightDrawer = document.createElement('div');
  rightDrawer.className = 'form-drawer right';
  document.body.appendChild(rightDrawer);

  let isOpen = false;
  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    toggle.classList.toggle('open', isOpen);
    leftDrawer.classList.toggle('open', isOpen);
    rightDrawer.classList.toggle('open', isOpen);
    toggle.textContent = isOpen ? 'close' : 'form';
  });

  // Build cards with live previews
  const previews: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; canvas: HTMLCanvasElement; updateFn: (t: number, dt: number) => void }[] = [];

  let selectedCard: HTMLElement | null = null;

  FORMS.forEach((form, i) => {
    const drawer = i < 4 ? leftDrawer : rightDrawer;

    const card = document.createElement('div');
    card.className = 'form-card';
    if (i === 0) { card.classList.add('selected'); selectedCard = card; }
    card.title = form.desc;

    const canvas = document.createElement('canvas');
    card.appendChild(canvas);

    const label = document.createElement('div');
    label.className = 'form-card-label';
    label.innerHTML = `<span class="form-card-name">${form.name}</span><span class="form-card-arch">${form.archetype}</span>`;
    card.appendChild(label);

    drawer.appendChild(card);

    // Mini Three.js scene
    const miniScene = new THREE.Scene();
    const miniCam = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    miniCam.position.set(0, 0.15, 1.6);
    miniCam.lookAt(0, 0, 0);

    const miniRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    miniRenderer.setClearColor(0x08081a, 1);

    const updateFn = form.build(miniScene);
    previews.push({ renderer: miniRenderer, scene: miniScene, camera: miniCam, canvas, updateFn });

    card.addEventListener('click', () => {
      if (selectedCard) selectedCard.classList.remove('selected');
      card.classList.add('selected');
      selectedCard = card;
      onFormChange(form.id);
    });
  });

  // Resize previews
  function resizePreviews() {
    for (const p of previews) {
      const rect = p.canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        p.renderer.setSize(rect.width, rect.height, false);
        p.camera.aspect = rect.width / rect.height;
        p.camera.updateProjectionMatrix();
      }
    }
  }

  // Animate previews only when open
  let lastTime = 0;
  function animatePreviews(now: number) {
    requestAnimationFrame(animatePreviews);
    if (!isOpen) return;
    const t = now * 0.001;
    const dt = Math.min(t - lastTime, 0.05);
    lastTime = t;

    // Resize on first visible frame
    if (previews[0].canvas.getBoundingClientRect().width > 0) {
      resizePreviews();
    }

    for (const p of previews) {
      p.updateFn(t, dt);
      p.renderer.render(p.scene, p.camera);
    }
  }
  requestAnimationFrame(animatePreviews);

  window.addEventListener('resize', () => { if (isOpen) resizePreviews(); });
}

export function getFormById(id: FormId): DaemonFormDef | undefined {
  return FORMS.find(f => f.id === id);
}

export { FORMS };
