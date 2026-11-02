import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Cyber Mandala & Liquid Plasma Orb Mode
 * Features:
 * - Central undulating 3D morphing plasma orb with reactive vertices
 * - Interlocking sacred geometry polyhedra (Merkaba / Star Tetrahedron & Icosahedron)
 * - 3 Concentric gimbal gyroscope rings with audio waveform teeth
 * - 16 Glowing fractal lotus petals that bloom on beat drops
 * - Luminous stardust halo
 */
export class CyberMandalaMode {
  public group: THREE.Group;

  // Visual sub-elements
  private plasmaOrb: THREE.Mesh;
  private plasmaWire: THREE.LineSegments;
  private starTetrahedron: THREE.Group;
  private ring1: THREE.LineLoop;
  private ring2: THREE.LineLoop;
  private ring3: THREE.LineLoop;
  private petalGroup: THREE.Group;
  private stardust: THREE.Points;

  // Vertex data
  private originalOrbVertices: Float32Array;
  private originalRing1Vertices: Float32Array;
  private originalRing2Vertices: Float32Array;

  private beatScale: number = 1.0;
  private rotationAngle: number = 0;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Central Morphing Plasma Sphere (Icosahedron sub-divided for smooth deformation)
    const orbGeo = new THREE.IcosahedronGeometry(2.0, 3);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x004466,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    this.plasmaOrb = new THREE.Mesh(orbGeo, orbMat);
    this.group.add(this.plasmaOrb);

    // Holographic wireframe cage over plasma orb
    const wireGeo = new THREE.WireframeGeometry(orbGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.plasmaWire = new THREE.LineSegments(wireGeo, wireMat);
    this.group.add(this.plasmaWire);

    this.originalOrbVertices = new Float32Array(orbGeo.attributes.position.array);

    // 2. Star Tetrahedron (Merkaba) - Two intersecting tetrahedrons
    this.starTetrahedron = new THREE.Group();
    const tet1 = new THREE.TetrahedronGeometry(3.6, 0);
    const tet1Wire = new THREE.WireframeGeometry(tet1);
    const tet1Mesh = new THREE.LineSegments(
      tet1Wire,
      new THREE.LineBasicMaterial({
        color: 0xff007f,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.starTetrahedron.add(tet1Mesh);

    const tet2 = new THREE.TetrahedronGeometry(3.6, 0);
    tet2.rotateX(Math.PI);
    tet2.rotateY(Math.PI / 4);
    const tet2Wire = new THREE.WireframeGeometry(tet2);
    const tet2Mesh = new THREE.LineSegments(
      tet2Wire,
      new THREE.LineBasicMaterial({
        color: 0xffe600,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.starTetrahedron.add(tet2Mesh);
    this.group.add(this.starTetrahedron);

    // 3. Concentric Frequency Gyroscope Rings (128 points for smooth circular waveforms)
    const ringSegs = 128;
    const r1Geo = new THREE.BufferGeometry();
    const r1Pos = new Float32Array((ringSegs + 1) * 3);
    for (let i = 0; i <= ringSegs; i++) {
      const a = (i / ringSegs) * Math.PI * 2;
      r1Pos[i * 3] = Math.cos(a) * 4.6;
      r1Pos[i * 3 + 1] = Math.sin(a) * 4.6;
      r1Pos[i * 3 + 2] = 0;
    }
    r1Geo.setAttribute('position', new THREE.BufferAttribute(r1Pos, 3));
    this.ring1 = new THREE.LineLoop(
      r1Geo,
      new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.ring1);
    this.originalRing1Vertices = new Float32Array(r1Pos);

    // Ring 2 (Tilted outer ring)
    const r2Geo = new THREE.BufferGeometry();
    const r2Pos = new Float32Array((ringSegs + 1) * 3);
    for (let i = 0; i <= ringSegs; i++) {
      const a = (i / ringSegs) * Math.PI * 2;
      r2Pos[i * 3] = Math.cos(a) * 6.4;
      r2Pos[i * 3 + 1] = Math.sin(a) * 6.4;
      r2Pos[i * 3 + 2] = 0;
    }
    r2Geo.setAttribute('position', new THREE.BufferAttribute(r2Pos, 3));
    this.ring2 = new THREE.LineLoop(
      r2Geo,
      new THREE.LineBasicMaterial({
        color: 0xff007f,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.ring2);
    this.originalRing2Vertices = new Float32Array(r2Pos);

    // Ring 3 (Deep outer perimeter)
    const r3Geo = new THREE.BufferGeometry();
    const r3Pos = new Float32Array((ringSegs + 1) * 3);
    for (let i = 0; i <= ringSegs; i++) {
      const a = (i / ringSegs) * Math.PI * 2;
      r3Pos[i * 3] = Math.cos(a) * 8.5;
      r3Pos[i * 3 + 1] = Math.sin(a) * 8.5;
      r3Pos[i * 3 + 2] = 0;
    }
    r3Geo.setAttribute('position', new THREE.BufferAttribute(r3Pos, 3));
    this.ring3 = new THREE.LineLoop(
      r3Geo,
      new THREE.LineBasicMaterial({
        color: 0xffe600,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.ring3);

    // 4. 16 Blooming Sacred Fractal Lotus Petals
    this.petalGroup = new THREE.Group();
    const petalCount = 16;
    for (let p = 0; p < petalCount; p++) {
      const angle = (p / petalCount) * Math.PI * 2;
      const petalGeo = new THREE.BufferGeometry();
      const ptsCount = 32;
      const pts = new Float32Array(ptsCount * 3);
      for (let j = 0; j < ptsCount; j++) {
        const t = j / (ptsCount - 1);
        const radius = 2.2 + Math.sin(t * Math.PI) * 3.5;
        const curA = angle + (t - 0.5) * 0.42;
        pts[j * 3] = Math.cos(curA) * radius;
        pts[j * 3 + 1] = Math.sin(curA) * radius;
        pts[j * 3 + 2] = Math.sin(t * Math.PI) * 1.5;
      }
      petalGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const petalLine = new THREE.Line(
        petalGeo,
        new THREE.LineBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        })
      );
      this.petalGroup.add(petalLine);
    }
    this.group.add(this.petalGroup);

    // 5. Crystalline Stardust Halo (1,200 points)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 2.0 + Math.pow(Math.random(), 1.4) * 8.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      starPos[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.sin(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.stardust = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 0.16,
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.stardust);
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    // 1. Beat pulse & smooth decay
    if (audio.isBeat) {
      this.beatScale = 1.0 + audio.beatIntensity * 0.55;
    } else {
      this.beatScale += (1.0 - this.beatScale) * 0.12;
    }

    // 2. Gyroscope rotations
    const rotSpeed = settings.rotationSpeed * (1.0 + audio.overallEnergy * 1.8);
    this.rotationAngle += delta * rotSpeed;

    this.starTetrahedron.rotation.x = this.rotationAngle * 0.7;
    this.starTetrahedron.rotation.y = this.rotationAngle * 0.9;
    this.starTetrahedron.rotation.z = this.rotationAngle * 0.3;

    this.ring1.rotation.z = this.rotationAngle * 0.35;
    this.ring2.rotation.x = Math.sin(this.rotationAngle * 0.3) * 0.7;
    this.ring2.rotation.y = this.rotationAngle * 0.45;
    this.ring3.rotation.y = -this.rotationAngle * 0.25;
    this.ring3.rotation.z = Math.cos(this.rotationAngle * 0.2) * 0.5;

    this.petalGroup.rotation.z = this.rotationAngle * 0.2;

    // 3. Deform Central Plasma Sphere via Frequency harmonics & Speech
    const orbPosAttr = this.plasmaOrb.geometry.attributes.position;
    const orbPos = orbPosAttr.array as Float32Array;
    const orig = this.originalOrbVertices;
    const vocalPulsing = audio.mid * 1.2 + audio.highMid * 0.8;

    for (let i = 0; i < orig.length; i += 3) {
      const ox = orig[i];
      const oy = orig[i + 1];
      const oz = orig[i + 2];
      const dist = Math.sqrt(ox * ox + oy * oy + oz * oz);

      // Spherical harmonic noise ripple
      const theta = Math.atan2(oy, ox);
      const phi = Math.acos(oz / dist);

      const ripple1 = Math.sin(theta * 4 + this.time * 6.0) * audio.subBass * 0.6;
      const ripple2 = Math.cos(phi * 5 + this.time * 5.0) * vocalPulsing * 0.5;
      const shimmer = Math.sin(dist * 6 + this.time * 8.0) * audio.treble * 0.3;

      const scale = this.beatScale * (1.0 + audio.bass * 0.4) + ripple1 + ripple2 + shimmer;

      orbPos[i] = ox * scale;
      orbPos[i + 1] = oy * scale;
      orbPos[i + 2] = oz * scale;
    }
    orbPosAttr.needsUpdate = true;
    this.plasmaOrb.geometry.computeVertexNormals();

    // Sync wireframe cage
    this.plasmaWire.scale.set(this.beatScale * 1.05, this.beatScale * 1.05, this.beatScale * 1.05);

    // 4. Oscilloscope waveforms on Gyroscope Rings
    const r1Attr = this.ring1.geometry.attributes.position;
    const r1Arr = r1Attr.array as Float32Array;
    const origR1 = this.originalRing1Vertices;
    const freq = audio.frequencyArray;
    const freqStep = Math.max(1, Math.floor(freq.length / (origR1.length / 3)));

    for (let i = 0; i < origR1.length; i += 3) {
      const idx = ((i / 3) * freqStep) % freq.length;
      const fVal = (freq[idx] || 0) / 255;
      const waveMod = 1.0 + fVal * 0.45 + audio.subBass * 0.35;
      r1Arr[i] = origR1[i] * waveMod;
      r1Arr[i + 1] = origR1[i + 1] * waveMod;
      r1Arr[i + 2] = Math.sin(i * 0.2 + this.time * 6.0) * fVal * 1.2;
    }
    r1Attr.needsUpdate = true;

    // 5. Blooming Lotus Petals opening on bass kicks & vocal swells
    const bloomSpread = 1.0 + audio.bass * 0.8 + (audio.isBeat ? 0.4 : 0);
    this.petalGroup.scale.set(bloomSpread, bloomSpread, 1.0 + vocalPulsing * 0.6);

    // 6. Update Materials & Colors from active Palette
    const orbMat = this.plasmaOrb.material as THREE.MeshStandardMaterial;
    orbMat.color.set(palette.primary);
    orbMat.emissive.set(palette.glow);
    orbMat.emissiveIntensity = 0.5 + audio.overallEnergy * 1.5 + (audio.isBeat ? 1.0 : 0);

    (this.plasmaWire.material as THREE.LineBasicMaterial).color.set(palette.accent);

    this.starTetrahedron.children.forEach((c, idx) => {
      const line = c as THREE.LineSegments;
      (line.material as THREE.LineBasicMaterial).color.set(idx === 0 ? palette.secondary : palette.accent);
    });

    (this.ring1.material as THREE.LineBasicMaterial).color.set(palette.primary);
    (this.ring2.material as THREE.LineBasicMaterial).color.set(palette.secondary);
    (this.ring3.material as THREE.LineBasicMaterial).color.set(palette.accent);

    this.petalGroup.children.forEach((c, idx) => {
      const line = c as THREE.Line;
      const mat = line.material as THREE.LineBasicMaterial;
      mat.color.set(idx % 2 === 0 ? palette.primary : palette.accent);
      mat.opacity = 0.5 + audio.overallEnergy * 0.5;
    });

    const starMat = this.stardust.material as THREE.PointsMaterial;
    starMat.color.set(palette.primary);
    starMat.size = (0.14 + audio.treble * 0.2) * settings.glowIntensity;
  }

  public dispose(): void {
    this.plasmaOrb.geometry.dispose();
    (this.plasmaOrb.material as THREE.Material).dispose();
    this.plasmaWire.geometry.dispose();
    (this.plasmaWire.material as THREE.Material).dispose();

    this.starTetrahedron.children.forEach((c) => {
      const l = c as THREE.LineSegments;
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });

    this.ring1.geometry.dispose();
    (this.ring1.material as THREE.Material).dispose();
    this.ring2.geometry.dispose();
    (this.ring2.material as THREE.Material).dispose();
    this.ring3.geometry.dispose();
    (this.ring3.material as THREE.Material).dispose();

    this.petalGroup.children.forEach((c) => {
      const l = c as THREE.Line;
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });

    this.stardust.geometry.dispose();
    (this.stardust.material as THREE.Material).dispose();
  }
}
