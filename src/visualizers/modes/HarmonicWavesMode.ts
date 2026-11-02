import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Harmonic Waves Mode (Неоновый Океан Волн)
 * A cascading 3D sea of 32 luminous harmonic wave lines.
 * Reacts with silky fluidity to gentle melodies, piano, vocals, chords, and ambient music.
 */
export class HarmonicWavesMode {
  public group: THREE.Group;
  private waveLines: THREE.Line[] = [];
  private numLines: number = 32;
  private pointsPerLine: number = 96;
  private waveWidth: number = 22;
  private waveDepth: number = 24;
  private time: number = 0;
  private embers: THREE.Points;

  constructor() {
    this.group = new THREE.Group();

    // 1. Create 32 harmonic wave contour lines
    for (let l = 0; l < this.numLines; l++) {
      const z = (l / (this.numLines - 1) - 0.5) * this.waveDepth;
      const geo = new THREE.BufferGeometry();
      const pts = new Float32Array(this.pointsPerLine * 3);

      for (let p = 0; p < this.pointsPerLine; p++) {
        const x = (p / (this.pointsPerLine - 1) - 0.5) * this.waveWidth;
        pts[p * 3] = x;
        pts[p * 3 + 1] = 0;
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

      this.waveLines.push(line);
      this.group.add(line);
    }

    // 2. Gentle floating harmonic embers above waves
    const emberCount = 600;
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      emberPos[i * 3] = (Math.random() - 0.5) * 22;
      emberPos[i * 3 + 1] = Math.random() * 5.0;
      emberPos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));

    this.embers = new THREE.Points(
      emberGeo,
      new THREE.PointsMaterial({
        size: 0.14,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.embers);

    // Initial slight pitch tilt so the waves stretch toward the horizon
    this.group.position.y = -1.2;
    this.group.rotation.x = 0.22;
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    const freqArr = audio.frequencyArray;
    const melodicFlow = audio.mid * 2.2 + audio.highMid * 1.5 + audio.overallEnergy * 1.2;
    const pitchFactor = Math.min(3.0, audio.dominantFrequency > 40 ? audio.dominantFrequency / 240 : 1.0);

    for (let l = 0; l < this.numLines; l++) {
      const line = this.waveLines[l];
      const posAttr = line.geometry.attributes.position;
      const pts = posAttr.array as Float32Array;

      const lineRatio = l / (this.numLines - 1);
      // Sample frequency spectrum across line depth
      const freqIdx = Math.floor(lineRatio * (freqArr.length * 0.45)) % freqArr.length;
      const freqVal = (freqArr[freqIdx] || 0) / 255;

      const phaseOffset = lineRatio * Math.PI * 4.0;

      for (let p = 0; p < this.pointsPerLine; p++) {
        const x = pts[p * 3];
        const pRatio = p / (this.pointsPerLine - 1);

        // Gentle sinusoidal traveling ocean waves
        const wave1 = Math.sin(x * 0.45 * pitchFactor + this.time * 2.5 - phaseOffset);
        const wave2 = Math.cos(x * 0.9 + this.time * 1.8 + phaseOffset * 0.5);
        const wave3 = Math.sin(pRatio * Math.PI * 2.0 + this.time * 3.0);

        // Height is intensely responsive to slow melodies & harmonics
        const height = (wave1 * 1.4 + wave2 * 0.7 + wave3 * 0.4) * (0.35 + melodicFlow * 1.2 + freqVal * 1.5);

        pts[p * 3 + 1] = height;
      }
      posAttr.needsUpdate = true;

      // Color gradation from foreground to distant horizon
      const mat = line.material as THREE.LineBasicMaterial;
      if (l % 3 === 0) mat.color.set(palette.primary);
      else if (l % 3 === 1) mat.color.set(palette.secondary);
      else mat.color.set(palette.accent);

      // Deep perspective fade
      const depthOpacity = Math.max(0.3, 1.0 - Math.abs(lineRatio - 0.5) * 0.8);
      mat.opacity = depthOpacity * (0.6 + audio.overallEnergy * 0.4);
    }

    // Ember gentle float
    const emberPos = this.embers.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < emberPos.length; i += 3) {
      emberPos[i + 1] += delta * (0.6 + audio.mid * 1.5);
      if (emberPos[i + 1] > 6.0) emberPos[i + 1] = 0.2;
    }
    this.embers.geometry.attributes.position.needsUpdate = true;

    (this.embers.material as THREE.PointsMaterial).color.set(palette.accent);
  }

  public dispose(): void {
    this.waveLines.forEach((l) => {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.embers.geometry.dispose();
    (this.embers.material as THREE.Material).dispose();
  }
}
