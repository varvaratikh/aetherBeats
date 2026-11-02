import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Resonance Strings Mode (Струны Резонанса & Лазерная Арфа)
 * 24 vibrating standing-wave strings that oscillate with real physical resonance
 * in response to melodies, acoustic instruments, singing, and piano notes.
 */
export class ResonanceStringsMode {
  public group: THREE.Group;
  private strings: THREE.Line[] = [];
  private nodes: THREE.Points;
  private numStrings: number = 24;
  private pointsPerString: number = 64;
  private stringHeight: number = 14;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // Arrange strings in a circular harp / cylinder (radius 5.0)
    for (let s = 0; s < this.numStrings; s++) {
      const angle = (s / this.numStrings) * Math.PI * 2;
      const x = Math.cos(angle) * 5.2;
      const z = Math.sin(angle) * 5.2;

      const geo = new THREE.BufferGeometry();
      const pts = new Float32Array(this.pointsPerString * 3);

      for (let p = 0; p < this.pointsPerString; p++) {
        const y = (p / (this.pointsPerString - 1) - 0.5) * this.stringHeight;
        pts[p * 3] = x;
        pts[p * 3 + 1] = y;
        pts[p * 3 + 2] = z;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));

      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
        })
      );

      this.strings.push(line);
      this.group.add(line);
    }

    // Glowing harmonic antinode beads
    const nodeCount = this.numStrings * 3;
    const nodeGeo = new THREE.BufferGeometry();
    const nodePos = new Float32Array(nodeCount * 3);
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));

    this.nodes = new THREE.Points(
      nodeGeo,
      new THREE.PointsMaterial({
        size: 0.22,
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.nodes);

    // End caps (top & bottom glowing frame rings)
    const capGeo = new THREE.RingGeometry(5.05, 5.35, 48);
    const capMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.y = this.stringHeight / 2;
    topCap.rotation.x = Math.PI / 2;
    this.group.add(topCap);

    const bottomCap = topCap.clone();
    bottomCap.position.y = -this.stringHeight / 2;
    this.group.add(bottomCap);
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    const freqArr = audio.frequencyArray;
    const nodePos = this.nodes.geometry.attributes.position.array as Float32Array;
    let nodeIdx = 0;

    for (let s = 0; s < this.numStrings; s++) {
      const line = this.strings[s];
      const posAttr = line.geometry.attributes.position;
      const pts = posAttr.array as Float32Array;

      const angle = (s / this.numStrings) * Math.PI * 2;
      const baseX = Math.cos(angle) * 5.2;
      const baseZ = Math.sin(angle) * 5.2;

      // Sample frequency per string
      const freqIndex = Math.floor((s / this.numStrings) * (freqArr.length * 0.4)) % freqArr.length;
      const stringEnergy = (freqArr[freqIndex] || 0) / 255;
      const harmonicNumber = 1 + (s % 4); // 1st, 2nd, 3rd harmonic modes
      const amplitude = (0.2 + stringEnergy * 1.8 + audio.overallEnergy * 0.8);

      for (let p = 0; p < this.pointsPerString; p++) {
        const t = p / (this.pointsPerString - 1);
        const y = (t - 0.5) * this.stringHeight;

        // Standing wave physical formula: sin(n * pi * t) * cos(omega * time)
        const standingWave = Math.sin(t * Math.PI * harmonicNumber) * Math.cos(this.time * 8.0 + s * 0.4);
        const displacement = standingWave * amplitude;

        // Displace radially from cylinder axis
        pts[p * 3] = baseX + Math.cos(angle) * displacement;
        pts[p * 3 + 1] = y;
        pts[p * 3 + 2] = baseZ + Math.sin(angle) * displacement;

        // Record node position at antinode
        if ((p === 16 || p === 32 || p === 48) && nodeIdx < nodePos.length) {
          nodePos[nodeIdx * 3] = pts[p * 3];
          nodePos[nodeIdx * 3 + 1] = pts[p * 3 + 1];
          nodePos[nodeIdx * 3 + 2] = pts[p * 3 + 2];
          nodeIdx++;
        }
      }
      posAttr.needsUpdate = true;

      const mat = line.material as THREE.LineBasicMaterial;
      if (s % 3 === 0) mat.color.set(palette.primary);
      else if (s % 3 === 1) mat.color.set(palette.secondary);
      else mat.color.set(palette.accent);

      mat.opacity = 0.5 + stringEnergy * 0.5;
    }

    this.nodes.geometry.attributes.position.needsUpdate = true;
    (this.nodes.material as THREE.PointsMaterial).color.set(palette.accent);
  }

  public dispose(): void {
    this.strings.forEach((s) => {
      s.geometry.dispose();
      (s.material as THREE.Material).dispose();
    });
    this.nodes.geometry.dispose();
    (this.nodes.material as THREE.Material).dispose();
  }
}
