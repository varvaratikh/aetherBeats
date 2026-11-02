import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Bioluminescent Aurora & Vocal Plasma Waves Mode
 * Creates a hypnotic undulating sea of glowing neon ribbons and bio-plasma surfaces
 * with high sensitivity to speech formants, vocal pitch, and musical phrasing.
 */
export class BioluminescentMode {
  public group: THREE.Group;
  private ribbonMeshes: THREE.Mesh[] = [];
  private ribbonWires: THREE.LineSegments[] = [];
  private ribbonOriginalPositions: Float32Array[] = [];
  private numRibbons: number = 7;
  private ribbonWidth: number = 18;
  private segmentsX: number = 64;
  private segmentsY: number = 6;
  private spores: THREE.Points;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();

    for (let r = 0; r < this.numRibbons; r++) {
      const geo = new THREE.PlaneGeometry(this.ribbonWidth, 3.5, this.segmentsX, this.segmentsY);
      this.ribbonOriginalPositions.push(new Float32Array(geo.attributes.position.array));

      // Translucent glowing surface
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00f5d4,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const yOffset = (r - (this.numRibbons - 1) / 2) * 1.6;
      const zOffset = (r - (this.numRibbons - 1) / 2) * 1.8;
      mesh.position.set(0, yOffset, zOffset);
      mesh.rotation.x = Math.PI * 0.25;

      this.ribbonMeshes.push(mesh);
      this.group.add(mesh);

      // Glowing wireframe contour lines
      const wireGeo = new THREE.WireframeGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.position.copy(mesh.position);
      wire.rotation.copy(mesh.rotation);
      this.ribbonWires.push(wire);
      this.group.add(wire);
    }

    // Floating luminous bio-spores
    const sporeCount = 800;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePos = new Float32Array(sporeCount * 3);
    for (let i = 0; i < sporeCount; i++) {
      sporePos[i * 3] = (Math.random() - 0.5) * 20;
      sporePos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      sporePos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));

    this.spores = new THREE.Points(
      sporeGeo,
      new THREE.PointsMaterial({
        size: 0.22,
        color: 0x00f5d4,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.spores);
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    const vocalEnergy = audio.mid * 2.0 + audio.highMid * 1.4;
    const waveSpeed = 2.2 + vocalEnergy * 2.5;
    const pitchFactor = Math.min(2.5, audio.dominantFrequency > 50 ? audio.dominantFrequency / 350 : 1.0);

    for (let r = 0; r < this.numRibbons; r++) {
      const mesh = this.ribbonMeshes[r];
      const posAttr = mesh.geometry.attributes.position;
      const pos = posAttr.array as Float32Array;
      const orig = this.ribbonOriginalPositions[r];
      const ribbonPhase = r * 0.7;

      for (let i = 0; i < orig.length; i += 3) {
        const ox = orig[i];
        const oy = orig[i + 1];

        // Complex multi-harmonic ocean wave displacement
        const wave1 = Math.sin(ox * 0.45 * pitchFactor + this.time * waveSpeed + ribbonPhase);
        const wave2 = Math.cos(ox * 0.9 - this.time * (waveSpeed * 0.8) + ribbonPhase);
        const wave3 = Math.sin(oy * 1.2 + this.time * 3.0);

        const amplitude = (0.5 + vocalEnergy * 1.8 + audio.overallEnergy * 0.8);
        const zDisplacement = (wave1 * 1.2 + wave2 * 0.6 + wave3 * 0.4) * amplitude;

        pos[i] = ox;
        pos[i + 1] = oy + wave1 * 0.4 * amplitude;
        pos[i + 2] = zDisplacement;
      }
      posAttr.needsUpdate = true;
      mesh.geometry.computeVertexNormals();

      // Colors per ribbon
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const wireMat = this.ribbonWires[r].material as THREE.LineBasicMaterial;

      if (r % 3 === 0) {
        mat.color.set(palette.primary);
        wireMat.color.set(palette.primary);
      } else if (r % 3 === 1) {
        mat.color.set(palette.secondary);
        wireMat.color.set(palette.secondary);
      } else {
        mat.color.set(palette.accent);
        wireMat.color.set(palette.accent);
      }

      mat.opacity = (0.25 + audio.overallEnergy * 0.4) * settings.glowIntensity;
      wireMat.opacity = (0.5 + audio.overallEnergy * 0.5) * settings.glowIntensity;
    }

    // Spore drift animation
    const sporeAttr = this.spores.geometry.attributes.position;
    const sporeArr = sporeAttr.array as Float32Array;
    for (let i = 0; i < sporeArr.length; i += 3) {
      sporeArr[i + 1] += delta * (0.8 + audio.mid * 2.0); // Float upward
      if (sporeArr[i + 1] > 7.0) {
        sporeArr[i + 1] = -7.0;
      }
    }
    sporeAttr.needsUpdate = true;

    // Gentle global float
    this.group.rotation.y = Math.sin(this.time * 0.25) * 0.25 * settings.rotationSpeed;
    this.group.rotation.x = Math.sin(this.time * 0.18) * 0.15;

    const sMat = this.spores.material as THREE.PointsMaterial;
    sMat.color.set(palette.primary);
    sMat.size = (0.18 + audio.treble * 0.18) * settings.glowIntensity;
  }

  public dispose(): void {
    this.ribbonMeshes.forEach((m) => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    this.ribbonWires.forEach((w) => {
      w.geometry.dispose();
      (w.material as THREE.Material).dispose();
    });
    this.spores.geometry.dispose();
    (this.spores.material as THREE.Material).dispose();
  }
}
