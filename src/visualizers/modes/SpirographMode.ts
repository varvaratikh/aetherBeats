import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Spirograph & Lissajous Kaleidoscope Mode
 * Hypnotic mathematical line curves that continuously morph and weave
 * intricate geometric lace with every chord, melodic pitch, and vocal cadence.
 */
export class SpirographMode {
  public group: THREE.Group;
  private curveLines: THREE.Line[] = [];
  private numCurves: number = 5;
  private pointsPerCurve: number = 360;
  private time: number = 0;
  private currentRatioA: number = 3.0;
  private currentRatioB: number = 5.0;

  constructor() {
    this.group = new THREE.Group();

    for (let c = 0; c < this.numCurves; c++) {
      const geo = new THREE.BufferGeometry();
      const pts = new Float32Array(this.pointsPerCurve * 3);
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
      this.curveLines.push(line);
      this.group.add(line);
    }
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    // Pitch & melody shift mathematical ratios smoothly
    const pitch = audio.dominantFrequency > 50 ? audio.dominantFrequency / 150 : 2.5;
    const targetA = 2.0 + (pitch % 5.0);
    const targetB = 3.0 + audio.mid * 4.0;

    this.currentRatioA += (targetA - this.currentRatioA) * 0.05;
    this.currentRatioB += (targetB - this.currentRatioB) * 0.05;

    const baseRadius = 4.2 * (1.0 + audio.subBass * 0.4);

    for (let c = 0; c < this.numCurves; c++) {
      const line = this.curveLines[c];
      const posAttr = line.geometry.attributes.position;
      const pts = posAttr.array as Float32Array;

      const layerScale = 1.0 - c * 0.14;
      const layerPhase = (c * Math.PI) / this.numCurves + this.time * 0.4;
      const zOffset = (c - (this.numCurves - 1) / 2) * 1.2;

      for (let p = 0; p < this.pointsPerCurve; p++) {
        const theta = (p / this.pointsPerCurve) * Math.PI * 4;

        // Parametric Lissajous / Spirograph equations
        const r =
          baseRadius * layerScale * (1.0 + Math.sin(theta * this.currentRatioA + layerPhase) * 0.45);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z =
          zOffset + Math.sin(theta * this.currentRatioB + this.time * 2.0) * (0.8 + audio.mid * 1.5);

        pts[p * 3] = x;
        pts[p * 3 + 1] = y;
        pts[p * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;

      const mat = line.material as THREE.LineBasicMaterial;
      if (c % 3 === 0) mat.color.set(palette.primary);
      else if (c % 3 === 1) mat.color.set(palette.secondary);
      else mat.color.set(palette.accent);

      mat.opacity = 0.6 + audio.overallEnergy * 0.4;
    }

    this.group.rotation.z = this.time * 0.25 * settings.rotationSpeed;
    this.group.rotation.x = Math.sin(this.time * 0.3) * 0.35;
    this.group.rotation.y = Math.cos(this.time * 0.2) * 0.35;
  }

  public dispose(): void {
    this.curveLines.forEach((l) => {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
  }
}
