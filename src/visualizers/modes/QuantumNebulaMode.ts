import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

/**
 * Quantum Nebula & Cosmic Supernova Mode
 * 20,000 luminous particles in a logarithmic 4-arm spiral galaxy
 * with central pulsar core, audio standing waves, and beat shockwaves.
 */
export class QuantumNebulaMode {
  public group: THREE.Group;
  private particleCount: number = 12000;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;

  // Particle data arrays
  private positions: Float32Array;
  private basePositions: Float32Array;
  private colors: Float32Array;
  private orbitalRadii: Float32Array;
  private orbitalAngles: Float32Array;
  private orbitalVelocities: Float32Array;
  private armIndices: Float32Array;

  // Pulsar core
  private coreSphere: THREE.Mesh;
  private shockwaveDist: number = 0;
  private shockwaveActive: boolean = false;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();

    this.positions = new Float32Array(this.particleCount * 3);
    this.basePositions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.orbitalRadii = new Float32Array(this.particleCount);
    this.orbitalAngles = new Float32Array(this.particleCount);
    this.orbitalVelocities = new Float32Array(this.particleCount);
    this.armIndices = new Float32Array(this.particleCount);

    const numArms = 4;
    for (let i = 0; i < this.particleCount; i++) {
      const arm = i % numArms;
      this.armIndices[i] = arm;

      // Logarithmic spiral distribution
      const r = 0.4 + Math.pow(Math.random(), 1.5) * 14.0;
      const armOffset = (arm * Math.PI * 2) / numArms;
      const angle = armOffset + Math.log(r + 1.0) * 3.2 + (Math.random() - 0.5) * 0.4;

      this.orbitalRadii[i] = r;
      this.orbitalAngles[i] = angle;
      this.orbitalVelocities[i] = (0.2 + 1.4 / Math.sqrt(r + 0.4)) * 0.45;

      const zSpread = (Math.random() - 0.5) * (0.3 + r * 0.22);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = zSpread;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;

      this.colors[i * 3] = 0;
      this.colors[i * 3 + 1] = 0.9;
      this.colors[i * 3 + 2] = 1.0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Create high-res glowing particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.3)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.28,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.geometry, material);
    this.group.add(this.particles);

    // Glowing Pulsar Core
    const coreGeo = new THREE.SphereGeometry(0.8, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.coreSphere = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreSphere);
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    if (audio.isBeat) {
      this.shockwaveActive = true;
      this.shockwaveDist = 0;
    }

    if (this.shockwaveActive) {
      this.shockwaveDist += delta * (18.0 + audio.beatIntensity * 14.0);
      if (this.shockwaveDist > 20.0) {
        this.shockwaveActive = false;
      }
    }

    const posAttr = this.geometry.attributes.position;
    const colAttr = this.geometry.attributes.color;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    const baseRot = settings.rotationSpeed * delta * (1.0 + audio.bass * 1.5);
    const primaryRGB = palette.rgbPrimary;
    const secondaryRGB = palette.rgbSecondary;
    const accentRGB = palette.rgbAccent;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const r = this.orbitalRadii[i];
      let angle = this.orbitalAngles[i];
      const vel = this.orbitalVelocities[i];

      angle += vel * baseRot;
      this.orbitalAngles[i] = angle;

      // Frequency harmonic wave down spiral arms
      const freqIdx = Math.floor((r / 14.0) * (audio.frequencyArray.length * 0.45)) % audio.frequencyArray.length;
      const freqVal = (audio.frequencyArray[freqIdx] || 0) / 255;

      const waveZ = Math.sin(r * 2.5 - this.time * 5.0 + angle * 2.0) * (audio.mid * 2.0 + freqVal * 1.2);

      let currentR = r * (1.0 + audio.subBass * 0.45);

      if (this.shockwaveActive) {
        const distFromWave = Math.abs(currentR - this.shockwaveDist);
        if (distFromWave < 2.0) {
          const push = (2.0 - distFromWave) * (audio.beatIntensity + 0.5);
          currentR += push * 1.8;
        }
      }

      pos[idx] = Math.cos(angle) * currentR;
      pos[idx + 1] = Math.sin(angle) * currentR;
      pos[idx + 2] = this.basePositions[idx + 2] + waveZ;

      // Color gradation
      const colorRatio = Math.min(1.0, currentR / 12.0);
      const isShocked = this.shockwaveActive && Math.abs(currentR - this.shockwaveDist) < 1.4;

      if (isShocked) {
        col[idx] = accentRGB[0];
        col[idx + 1] = accentRGB[1];
        col[idx + 2] = accentRGB[2];
      } else {
        const rVal = primaryRGB[0] * (1 - colorRatio) + secondaryRGB[0] * colorRatio;
        const gVal = primaryRGB[1] * (1 - colorRatio) + secondaryRGB[1] * colorRatio;
        const bVal = primaryRGB[2] * (1 - colorRatio) + secondaryRGB[2] * colorRatio;

        const bright = 0.7 + audio.overallEnergy * 0.8;
        col[idx] = Math.min(1.0, rVal * bright);
        col[idx + 1] = Math.min(1.0, gVal * bright);
        col[idx + 2] = Math.min(1.0, bVal * bright);
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Pulsar core flare
    const coreScale = (0.8 + audio.subBass * 1.2 + (audio.isBeat ? 0.6 : 0)) * settings.glowIntensity;
    this.coreSphere.scale.set(coreScale, coreScale, coreScale);
    (this.coreSphere.material as THREE.MeshBasicMaterial).color.set(palette.glow);

    this.group.rotation.x = Math.PI * 0.16 + Math.sin(this.time * 0.35) * 0.1;
    this.group.rotation.y = Math.cos(this.time * 0.3) * 0.1;

    const pMat = this.particles.material as THREE.PointsMaterial;
    pMat.size = (0.24 + audio.bass * 0.18) * settings.glowIntensity;
  }

  public dispose(): void {
    this.geometry.dispose();
    const mat = this.particles.material as THREE.PointsMaterial;
    if (mat.map) mat.map.dispose();
    mat.dispose();

    this.coreSphere.geometry.dispose();
    (this.coreSphere.material as THREE.Material).dispose();
  }
}
