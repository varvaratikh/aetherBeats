import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

interface WormholeRing {
  mesh: THREE.LineLoop;
  baseRadius: number;
  zPos: number;
}

/**
 * Cyber Wormhole & Spiral Vortex Mode
 * A twisting, curving futuristic hyperspace vortex tunnel
 * with rotating fiber-optic rings, helical laser streams, and warp particle streaks.
 */
export class WormholeMode {
  public group: THREE.Group;
  private rings: WormholeRing[] = [];
  private numRings: number = 42;
  private tunnelLength: number = 65;
  private segmentsPerRing: number = 48;
  private helicalStreams: THREE.Line[] = [];
  private speedParticles: THREE.Points;
  private particleZ: Float32Array;
  private particleSpeed: Float32Array;
  private time: number = 0;
  private currentSpeed: number = 10.0;
  private tunnelOffsetZ: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Concentric circular rings forming curving wormhole
    for (let i = 0; i < this.numRings; i++) {
      const z = -(i / this.numRings) * this.tunnelLength;
      const baseR = 3.8;

      const geo = new THREE.BufferGeometry();
      const pts = new Float32Array((this.segmentsPerRing + 1) * 3);
      for (let s = 0; s <= this.segmentsPerRing; s++) {
        const theta = (s / this.segmentsPerRing) * Math.PI * 2;
        pts[s * 3] = Math.cos(theta) * baseR;
        pts[s * 3 + 1] = Math.sin(theta) * baseR;
        pts[s * 3 + 2] = 0;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.LineLoop(geo, lineMat);
      mesh.position.z = z;
      this.rings.push({
        mesh,
        baseRadius: baseR,
        zPos: z,
      });
      this.group.add(mesh);
    }

    // 2. Helical laser streams winding down the tunnel walls
    const numStreams = 8;
    for (let s = 0; s < numStreams; s++) {
      const streamGeo = new THREE.BufferGeometry();
      const ptsCount = 80;
      const pts = new Float32Array(ptsCount * 3);
      streamGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));

      const line = new THREE.Line(
        streamGeo,
        new THREE.LineBasicMaterial({
          color: 0xff007f,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        })
      );
      this.helicalStreams.push(line);
      this.group.add(line);
    }

    // 3. Speed particles
    const pCount = 700;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    this.particleZ = new Float32Array(pCount);
    this.particleSpeed = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 3.4;
      const z = -Math.random() * this.tunnelLength;
      pPos[i * 3] = Math.cos(angle) * r;
      pPos[i * 3 + 1] = Math.sin(angle) * r;
      pPos[i * 3 + 2] = z;

      this.particleZ[i] = z;
      this.particleSpeed[i] = 1.0 + Math.random() * 2.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.speedParticles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: 0.15,
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.speedParticles);
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    const targetSpeed = 8.0 + audio.overallEnergy * 30.0 + (audio.isBeat ? audio.beatIntensity * 35.0 : 0);
    this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.16;

    this.tunnelOffsetZ += this.currentSpeed * delta;
    if (this.tunnelOffsetZ > this.tunnelLength / this.numRings) {
      this.tunnelOffsetZ = 0;
    }

    // Update rings with spiral curve
    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      let currentZ = -(i / this.numRings) * this.tunnelLength + this.tunnelOffsetZ;
      if (currentZ > 2.0) {
        currentZ -= this.tunnelLength;
      }
      ring.mesh.position.z = currentZ;

      // S-curve wormhole bending
      const curveX = Math.sin(currentZ * 0.08 + this.time * 1.5) * 2.2;
      const curveY = Math.cos(currentZ * 0.06 + this.time * 1.2) * 1.8;
      ring.mesh.position.x = curveX;
      ring.mesh.position.y = curveY;

      const depthRatio = Math.max(0, Math.min(1, 1 - Math.abs(currentZ) / this.tunnelLength));
      const freqIdx = Math.floor(depthRatio * (audio.frequencyArray.length * 0.45)) % audio.frequencyArray.length;
      const freqVal = (audio.frequencyArray[freqIdx] || 0) / 255;

      const scale = 1.0 + audio.subBass * 0.5 * (1 - depthRatio) + freqVal * 0.6;
      ring.mesh.scale.set(scale, scale, 1.0);

      // Spin rotation down tunnel
      ring.mesh.rotation.z = this.time * 0.5 + currentZ * 0.1;

      const mat = ring.mesh.material as THREE.LineBasicMaterial;
      mat.color.set(i % 2 === 0 ? palette.primary : palette.secondary);
      mat.opacity = depthRatio * (0.5 + audio.overallEnergy * 0.5);
    }

    // Update helical streams
    for (let s = 0; s < this.helicalStreams.length; s++) {
      const line = this.helicalStreams[s];
      const posAttr = line.geometry.attributes.position;
      const pts = posAttr.array as Float32Array;
      const streamOffset = (s / this.helicalStreams.length) * Math.PI * 2;

      for (let p = 0; p < 80; p++) {
        const t = p / 79;
        const z = -t * this.tunnelLength;
        const curveX = Math.sin(z * 0.08 + this.time * 1.5) * 2.2;
        const curveY = Math.cos(z * 0.06 + this.time * 1.2) * 1.8;
        const angle = streamOffset + z * 0.2 + this.time * 3.0;

        pts[p * 3] = curveX + Math.cos(angle) * 3.8;
        pts[p * 3 + 1] = curveY + Math.sin(angle) * 3.8;
        pts[p * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;
      (line.material as THREE.LineBasicMaterial).color.set(palette.accent);
    }

    // Speed particles
    const pArr = this.speedParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pArr.length / 3; i++) {
      let z = this.particleZ[i] + this.currentSpeed * this.particleSpeed[i] * delta * 1.5;
      if (z > 3.0) z = -this.tunnelLength;
      this.particleZ[i] = z;
      pArr[i * 3 + 2] = z;
    }
    this.speedParticles.geometry.attributes.position.needsUpdate = true;
    (this.speedParticles.material as THREE.PointsMaterial).color.set(palette.primary);
  }

  public dispose(): void {
    this.rings.forEach((r) => {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });
    this.helicalStreams.forEach((s) => {
      s.geometry.dispose();
      (s.material as THREE.Material).dispose();
    });
    this.speedParticles.geometry.dispose();
    (this.speedParticles.material as THREE.Material).dispose();
  }
}
