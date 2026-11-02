import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

interface TunnelRib {
  mesh: THREE.LineLoop;
  innerGlow: THREE.Mesh;
  zPos: number;
}

/**
 * Hyperspace Warp Tunnel Mode
 * 3D infinite neon wireframe polygonal corridor with glowing portal gates,
 * illuminated rails, and hyperspace warp velocity streaks.
 */
export class WarpTunnelMode {
  public group: THREE.Group;
  private ribs: TunnelRib[] = [];
  private numRibs: number = 40;
  private tunnelLength: number = 60;
  private sidesPerRib: number = 8;
  private longitudinalRails: THREE.Line[] = [];
  private speedParticles: THREE.Points;
  private speedParticleCount: number = 900;
  private particleZ: Float32Array;
  private particleSpeed: Float32Array;

  private currentWarpSpeed: number = 12.0;
  private tunnelOffsetZ: number = 0;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Create octagonal wireframe ribs with inner glow mesh
    for (let i = 0; i < this.numRibs; i++) {
      const z = -(i / this.numRibs) * this.tunnelLength;
      const baseR = 3.6;

      const geo = new THREE.BufferGeometry();
      const pts = new Float32Array((this.sidesPerRib + 1) * 3);
      for (let s = 0; s <= this.sidesPerRib; s++) {
        const theta = (s / this.sidesPerRib) * Math.PI * 2 + Math.PI / 8;
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
      const lineLoop = new THREE.LineLoop(geo, lineMat);
      lineLoop.position.z = z;

      // Inner faint glowing rim
      const ringGeo = new THREE.RingGeometry(baseR * 0.94, baseR, 8, 1);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.z = z;

      this.ribs.push({
        mesh: lineLoop,
        innerGlow: ringMesh,
        zPos: z,
      });
      this.group.add(lineLoop);
      this.group.add(ringMesh);
    }

    // 2. Guide Rails connecting rib vertices
    for (let s = 0; s < this.sidesPerRib; s++) {
      const theta = (s / this.sidesPerRib) * Math.PI * 2 + Math.PI / 8;
      const x = Math.cos(theta) * 3.6;
      const y = Math.sin(theta) * 3.6;

      const railGeo = new THREE.BufferGeometry();
      const railPts = new Float32Array([
        x, y, 3.0,
        x, y, -this.tunnelLength
      ]);
      railGeo.setAttribute('position', new THREE.BufferAttribute(railPts, 3));

      const railLine = new THREE.Line(
        railGeo,
        new THREE.LineBasicMaterial({
          color: 0xff007f,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
        })
      );
      this.longitudinalRails.push(railLine);
      this.group.add(railLine);
    }

    // 3. Hyperspace speed stars
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(this.speedParticleCount * 3);
    this.particleZ = new Float32Array(this.speedParticleCount);
    this.particleSpeed = new Float32Array(this.speedParticleCount);

    for (let i = 0; i < this.speedParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.random() * 3.2;
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
        size: 0.16,
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

    const targetSpeed = 10.0 + audio.overallEnergy * 35.0 + (audio.isBeat ? audio.beatIntensity * 45.0 : 0);
    this.currentWarpSpeed += (targetSpeed - this.currentWarpSpeed) * 0.18;

    this.tunnelOffsetZ += this.currentWarpSpeed * delta;
    if (this.tunnelOffsetZ > this.tunnelLength / this.numRibs) {
      this.tunnelOffsetZ = 0;
    }

    for (let i = 0; i < this.numRibs; i++) {
      const rib = this.ribs[i];
      let currentZ = -(i / this.numRibs) * this.tunnelLength + this.tunnelOffsetZ;
      if (currentZ > 2.0) {
        currentZ -= this.tunnelLength;
      }
      rib.mesh.position.z = currentZ;
      rib.innerGlow.position.z = currentZ;

      const depthRatio = Math.max(0, Math.min(1, 1 - Math.abs(currentZ) / this.tunnelLength));
      const freqIdx = Math.floor(depthRatio * (audio.frequencyArray.length * 0.5)) % audio.frequencyArray.length;
      const freqVal = (audio.frequencyArray[freqIdx] || 0) / 255;

      const scale = 1.0 + audio.subBass * 0.6 * (1 - depthRatio) + freqVal * 0.7;
      rib.mesh.scale.set(scale, scale, 1.0);
      rib.innerGlow.scale.set(scale, scale, 1.0);

      const rot = this.time * 0.4 + currentZ * 0.06;
      rib.mesh.rotation.z = rot;
      rib.innerGlow.rotation.z = rot;

      const lineMat = rib.mesh.material as THREE.LineBasicMaterial;
      const glowMat = rib.innerGlow.material as THREE.MeshBasicMaterial;

      lineMat.color.set(i % 2 === 0 ? palette.primary : palette.secondary);
      glowMat.color.set(palette.glow);

      lineMat.opacity = depthRatio * (0.4 + audio.overallEnergy * 0.6);
      glowMat.opacity = depthRatio * (0.1 + audio.overallEnergy * 0.25);
    }

    this.longitudinalRails.forEach((rail, idx) => {
      const mat = rail.material as THREE.LineBasicMaterial;
      mat.color.set(idx % 2 === 0 ? palette.secondary : palette.accent);
      mat.opacity = 0.35 + audio.bass * 0.6;
    });

    const pPosAttr = this.speedParticles.geometry.attributes.position;
    const pArr = pPosAttr.array as Float32Array;
    for (let i = 0; i < this.speedParticleCount; i++) {
      let z = this.particleZ[i] + this.currentWarpSpeed * this.particleSpeed[i] * delta * 1.5;
      if (z > 3.0) {
        z = -this.tunnelLength;
      }
      this.particleZ[i] = z;
      pArr[i * 3 + 2] = z;
    }
    pPosAttr.needsUpdate = true;

    const pMat = this.speedParticles.material as THREE.PointsMaterial;
    pMat.color.set(palette.accent);
    pMat.size = (0.14 + audio.treble * 0.15) * settings.glowIntensity;
  }

  public dispose(): void {
    this.ribs.forEach((r) => {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
      r.innerGlow.geometry.dispose();
      (r.innerGlow.material as THREE.Material).dispose();
    });
    this.longitudinalRails.forEach((l) => {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.speedParticles.geometry.dispose();
    (this.speedParticles.material as THREE.Material).dispose();
  }
}
