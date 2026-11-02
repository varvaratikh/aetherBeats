import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Quantum DNA Helix & Radiant Spiral Mode
 * Intertwined glowing double-helix in 3D space with connecting base rungs,
 * energy impulses traveling along the strands, and radial dilation on beats.
 */
export class DnaHelixMode {
  public group: THREE.Group;
  private strand1Mesh: THREE.InstancedMesh;
  private strand2Mesh: THREE.InstancedMesh;
  private rungs: THREE.Line[] = [];
  private particles: THREE.Points;
  private numNodes: number = 80;
  private time: number = 0;
  private beatScale: number = 1.0;

  // Temp helpers
  private dummy: THREE.Object3D = new THREE.Object3D();

  constructor() {
    this.group = new THREE.Group();

    // Spheres for each node along strand 1 and 2
    const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const strand1Mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.strand1Mesh = new THREE.InstancedMesh(sphereGeo, strand1Mat, this.numNodes);
    this.group.add(this.strand1Mesh);

    const strand2Mat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.strand2Mesh = new THREE.InstancedMesh(sphereGeo, strand2Mat, this.numNodes);
    this.group.add(this.strand2Mesh);

    // Connecting Rungs between strands (every 2 nodes)
    for (let i = 0; i < this.numNodes; i += 2) {
      const rungGeo = new THREE.BufferGeometry();
      const rungPts = new Float32Array([0, 0, 0, 0, 0, 0]);
      rungGeo.setAttribute('position', new THREE.BufferAttribute(rungPts, 3));

      const rungLine = new THREE.Line(
        rungGeo,
        new THREE.LineBasicMaterial({
          color: 0xffe600,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
        })
      );
      this.rungs.push(rungLine);
      this.group.add(rungLine);
    }

    // Floating Quantum Aura Particles (800 particles)
    const pCount = 800;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const y = (Math.random() - 0.5) * 16;
      const r = 1.5 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      pPos[i * 3] = Math.cos(a) * r;
      pPos[i * 3 + 1] = y;
      pPos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: 0.14,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.particles);
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    if (audio.isBeat) {
      this.beatScale = 1.0 + audio.beatIntensity * 0.5;
    } else {
      this.beatScale += (1.0 - this.beatScale) * 0.12;
    }

    const rotSpeed = settings.rotationSpeed * (1.0 + audio.overallEnergy * 1.5);
    const baseRadius = 2.4 * this.beatScale * (1.0 + audio.subBass * 0.4);
    const heightSpan = 14.0;
    const pitchFactor = Math.min(2.5, audio.dominantFrequency > 50 ? audio.dominantFrequency / 300 : 1.0);
    const waveTravel = this.time * 4.0;

    let rungIdx = 0;

    for (let i = 0; i < this.numNodes; i++) {
      const t = (i / this.numNodes) - 0.5;
      const y = t * heightSpan;

      const angle = t * Math.PI * 8.0 * pitchFactor + this.time * rotSpeed * 1.5;
      const waveMod = Math.sin(t * 12.0 - waveTravel) * (audio.mid * 0.8);
      const r = baseRadius + waveMod;

      // Strand 1 Position
      const x1 = Math.cos(angle) * r;
      const z1 = Math.sin(angle) * r;
      this.dummy.position.set(x1, y, z1);
      const nodeScale = 1.0 + Math.sin(t * 10 - waveTravel) * 0.3 + (audio.isBeat ? 0.4 : 0);
      this.dummy.scale.set(nodeScale, nodeScale, nodeScale);
      this.dummy.updateMatrix();
      this.strand1Mesh.setMatrixAt(i, this.dummy.matrix);

      // Strand 2 Position (180 deg offset)
      const x2 = Math.cos(angle + Math.PI) * r;
      const z2 = Math.sin(angle + Math.PI) * r;
      this.dummy.position.set(x2, y, z2);
      this.dummy.updateMatrix();
      this.strand2Mesh.setMatrixAt(i, this.dummy.matrix);

      // Update Rung line
      if (i % 2 === 0 && rungIdx < this.rungs.length) {
        const rung = this.rungs[rungIdx];
        const rungPosAttr = rung.geometry.attributes.position;
        const pts = rungPosAttr.array as Float32Array;
        pts[0] = x1;
        pts[1] = y;
        pts[2] = z1;
        pts[3] = x2;
        pts[4] = y;
        pts[5] = z2;
        rungPosAttr.needsUpdate = true;
        (rung.material as THREE.LineBasicMaterial).color.set(palette.accent);
        (rung.material as THREE.LineBasicMaterial).opacity = 0.5 + audio.overallEnergy * 0.5;
        rungIdx++;
      }
    }

    this.strand1Mesh.instanceMatrix.needsUpdate = true;
    this.strand2Mesh.instanceMatrix.needsUpdate = true;

    // Material colors
    (this.strand1Mesh.material as THREE.MeshBasicMaterial).color.set(palette.primary);
    (this.strand2Mesh.material as THREE.MeshBasicMaterial).color.set(palette.secondary);

    // Particle swirl
    this.particles.rotation.y += delta * 0.3 * rotSpeed;
    const pMat = this.particles.material as THREE.PointsMaterial;
    pMat.color.set(palette.primary);
    pMat.size = (0.12 + audio.treble * 0.16) * settings.glowIntensity;
  }

  public dispose(): void {
    this.strand1Mesh.geometry.dispose();
    (this.strand1Mesh.material as THREE.Material).dispose();
    this.strand2Mesh.geometry.dispose();
    (this.strand2Mesh.material as THREE.Material).dispose();

    this.rungs.forEach((r) => {
      r.geometry.dispose();
      (r.material as THREE.Material).dispose();
    });

    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
  }
}
