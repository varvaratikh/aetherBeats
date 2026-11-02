import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Quantum Torus & Hypnotic Ring Reactor Mode
 * 3D undulating wireframe torus with rotating equatorial rings,
 * energy vortex, and reactive tube radius driven by frequency harmonics.
 */
export class QuantumTorusMode {
  public group: THREE.Group;
  private torusMesh: THREE.Mesh;
  private torusWire: THREE.LineSegments;
  private originalTorusPositions: Float32Array;
  private equatorialRing1: THREE.LineLoop;
  private equatorialRing2: THREE.LineLoop;
  private outerRing: THREE.LineLoop;
  private coreCrystal: THREE.Mesh;
  private ringParticles: THREE.Points;
  private time: number = 0;
  private beatScale: number = 1.0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Central Giant Torus (Tube: 3.2 radius, 1.1 tube, 36 radial segs, 100 tubular segs)
    const torusGeo = new THREE.TorusGeometry(3.4, 1.15, 30, 96);
    this.originalTorusPositions = new Float32Array(torusGeo.attributes.position.array);

    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x002244,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.8,
    });
    this.torusMesh = new THREE.Mesh(torusGeo, torusMat);
    this.group.add(this.torusMesh);

    // Torus Wireframe Overlay
    const wireGeo = new THREE.WireframeGeometry(torusGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.torusWire = new THREE.LineSegments(wireGeo, wireMat);
    this.group.add(this.torusWire);

    // 2. Central Pulsating Singularity Crystal (Octahedron)
    const coreGeo = new THREE.OctahedronGeometry(1.4, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.coreCrystal = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreCrystal);

    // 3. Counter-rotating Equatorial Rings (like Saturn's cyber rings)
    const ringSegs = 120;
    const r1Geo = new THREE.BufferGeometry();
    const r1Pos = new Float32Array((ringSegs + 1) * 3);
    for (let i = 0; i <= ringSegs; i++) {
      const a = (i / ringSegs) * Math.PI * 2;
      r1Pos[i * 3] = Math.cos(a) * 5.4;
      r1Pos[i * 3 + 1] = Math.sin(a) * 5.4;
      r1Pos[i * 3 + 2] = 0;
    }
    r1Geo.setAttribute('position', new THREE.BufferAttribute(r1Pos, 3));
    this.equatorialRing1 = new THREE.LineLoop(
      r1Geo,
      new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.equatorialRing1);

    // Ring 2 (Tilted)
    const r2Geo = new THREE.BufferGeometry();
    const r2Pos = new Float32Array((ringSegs + 1) * 3);
    for (let i = 0; i <= ringSegs; i++) {
      const a = (i / ringSegs) * Math.PI * 2;
      r2Pos[i * 3] = Math.cos(a) * 6.8;
      r2Pos[i * 3 + 1] = Math.sin(a) * 6.8;
      r2Pos[i * 3 + 2] = 0;
    }
    r2Geo.setAttribute('position', new THREE.BufferAttribute(r2Pos, 3));
    this.equatorialRing2 = new THREE.LineLoop(
      r2Geo,
      new THREE.LineBasicMaterial({
        color: 0xffe600,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.equatorialRing2);

    // Outer Ring
    const r3Geo = new THREE.BufferGeometry();
    const r3Pos = new Float32Array((ringSegs + 1) * 3);
    for (let i = 0; i <= ringSegs; i++) {
      const a = (i / ringSegs) * Math.PI * 2;
      r3Pos[i * 3] = Math.cos(a) * 8.6;
      r3Pos[i * 3 + 1] = Math.sin(a) * 8.6;
      r3Pos[i * 3 + 2] = 0;
    }
    r3Geo.setAttribute('position', new THREE.BufferAttribute(r3Pos, 3));
    this.outerRing = new THREE.LineLoop(
      r3Geo,
      new THREE.LineBasicMaterial({
        color: 0xff007f,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.outerRing);

    // 4. Orbiting Ring Particles (1,500 particles in a flat accretion disc)
    const pCount = 1500;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 4.8 + Math.random() * 4.2;
      const theta = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 0.4;
      pPos[i * 3] = Math.cos(theta) * r;
      pPos[i * 3 + 1] = Math.sin(theta) * r;
      pPos[i * 3 + 2] = z;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.ringParticles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: 0.16,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.ringParticles);
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    if (audio.isBeat) {
      this.beatScale = 1.0 + audio.beatIntensity * 0.45;
    } else {
      this.beatScale += (1.0 - this.beatScale) * 0.12;
    }

    const rotSpeed = settings.rotationSpeed * (1.0 + audio.overallEnergy * 1.5);
    const rotDelta = delta * rotSpeed;

    // Torus 3D tumbling rotation
    this.torusMesh.rotation.x += rotDelta * 0.6;
    this.torusMesh.rotation.y += rotDelta * 0.8;
    this.torusWire.rotation.copy(this.torusMesh.rotation);

    // Rings counter-rotation
    this.equatorialRing1.rotation.z += rotDelta * 0.5;
    this.equatorialRing2.rotation.x = Math.sin(this.time * 0.5) * 0.6;
    this.equatorialRing2.rotation.z -= rotDelta * 0.6;
    this.outerRing.rotation.y = Math.cos(this.time * 0.4) * 0.5;
    this.outerRing.rotation.z += rotDelta * 0.3;

    this.ringParticles.rotation.z += rotDelta * 0.4;

    // Core crystal tumble & pulse
    const coreScale = (1.0 + audio.subBass * 0.8 + (audio.isBeat ? 0.6 : 0)) * this.beatScale;
    this.coreCrystal.scale.set(coreScale, coreScale, coreScale);
    this.coreCrystal.rotation.x += rotDelta * 1.5;
    this.coreCrystal.rotation.y += rotDelta * 1.8;

    // Morph Torus vertices with frequency harmonics & vocal formants
    const posAttr = this.torusMesh.geometry.attributes.position;
    const pos = posAttr.array as Float32Array;
    const orig = this.originalTorusPositions;
    const vocalEnergy = audio.mid * 1.2 + audio.highMid * 0.8;

    for (let i = 0; i < orig.length; i += 3) {
      const ox = orig[i];
      const oy = orig[i + 1];
      const oz = orig[i + 2];

      const angle = Math.atan2(oy, ox);
      const wave = Math.sin(angle * 6 + this.time * 5.0) * audio.subBass * 0.4;
      const wave2 = Math.cos(oz * 3.0 + this.time * 6.0) * vocalEnergy * 0.35;

      const mod = this.beatScale + wave + wave2;

      pos[i] = ox * mod;
      pos[i + 1] = oy * mod;
      pos[i + 2] = oz * (1.0 + audio.bass * 0.4 + wave);
    }
    posAttr.needsUpdate = true;
    this.torusMesh.geometry.computeVertexNormals();

    this.torusWire.scale.set(this.beatScale * 1.03, this.beatScale * 1.03, this.beatScale * 1.03);

    // Update Materials & Colors
    const tMat = this.torusMesh.material as THREE.MeshStandardMaterial;
    tMat.color.set(palette.primary);
    tMat.emissive.set(palette.glow);
    tMat.emissiveIntensity = 0.5 + audio.overallEnergy * 1.5 + (audio.isBeat ? 1.2 : 0);

    (this.torusWire.material as THREE.LineBasicMaterial).color.set(palette.secondary);
    (this.coreCrystal.material as THREE.MeshBasicMaterial).color.set(palette.accent);
    (this.equatorialRing1.material as THREE.LineBasicMaterial).color.set(palette.primary);
    (this.equatorialRing2.material as THREE.LineBasicMaterial).color.set(palette.accent);
    (this.outerRing.material as THREE.LineBasicMaterial).color.set(palette.secondary);

    const pMat = this.ringParticles.material as THREE.PointsMaterial;
    pMat.color.set(palette.primary);
    pMat.size = (0.16 + audio.treble * 0.16) * settings.glowIntensity;
  }

  public dispose(): void {
    this.torusMesh.geometry.dispose();
    (this.torusMesh.material as THREE.Material).dispose();
    this.torusWire.geometry.dispose();
    (this.torusWire.material as THREE.Material).dispose();
    this.coreCrystal.geometry.dispose();
    (this.coreCrystal.material as THREE.Material).dispose();
    this.equatorialRing1.geometry.dispose();
    (this.equatorialRing1.material as THREE.Material).dispose();
    this.equatorialRing2.geometry.dispose();
    (this.equatorialRing2.material as THREE.Material).dispose();
    this.outerRing.geometry.dispose();
    (this.outerRing.material as THREE.Material).dispose();
    this.ringParticles.geometry.dispose();
    (this.ringParticles.material as THREE.Material).dispose();
  }
}
