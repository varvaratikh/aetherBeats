import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

interface CrystalTower {
  mesh: THREE.Mesh;
  wire: THREE.LineSegments;
  laserBeam: THREE.Line | null;
  baseX: number;
  baseZ: number;
  distFromCenter: number;
  freqBin: number;
  height: number;
  targetHeight: number;
}

/**
 * Cyberpunk Crystal Matrix & Frequency Towers Mode
 * A 3D grid of glowing hexagonal crystal monoliths forming an equalizer city,
 * with vertical laser beams and undulating energy waves.
 */
export class CrystalMatrixMode {
  public group: THREE.Group;
  private towers: CrystalTower[] = [];
  private gridFloor: THREE.GridHelper;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Grid Floor
    this.gridFloor = new THREE.GridHelper(24, 24, 0x00f0ff, 0x1e293b);
    this.gridFloor.position.y = -2.5;
    this.group.add(this.gridFloor);

    // 2. Generate 64 Hexagonal Crystal Towers
    const gridSize = 8;
    const spacing = 2.2;
    const hexGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.0, 6);
    const wireGeo = new THREE.WireframeGeometry(hexGeo);

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const posX = (x - (gridSize - 1) / 2) * spacing;
        const posZ = (z - (gridSize - 1) / 2) * spacing;
        const dist = Math.sqrt(posX * posX + posZ * posZ);

        if (dist > 9.0) continue; // Keep circular boundary

        const mat = new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x003355,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          metalness: 0.9,
          transparent: true,
          opacity: 0.85,
        });

        const mesh = new THREE.Mesh(hexGeo, mat);
        mesh.position.set(posX, -2.5, posZ);

        const wireMat = new THREE.LineBasicMaterial({
          color: 0xff007f,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        mesh.add(wire);

        // Laser beam shooting up
        let laser: THREE.Line | null = null;
        if (Math.random() < 0.45) {
          const laserGeo = new THREE.BufferGeometry();
          const laserPts = new Float32Array([0, 0, 0, 0, 14, 0]);
          laserGeo.setAttribute('position', new THREE.BufferAttribute(laserPts, 3));
          laser = new THREE.Line(
            laserGeo,
            new THREE.LineBasicMaterial({
              color: 0x00f0ff,
              transparent: true,
              opacity: 0.8,
              blending: THREE.AdditiveBlending,
            })
          );
          laser.visible = false;
          mesh.add(laser);
        }

        const freqBin = Math.floor((dist / 9.0) * 120);

        this.towers.push({
          mesh,
          wire,
          laserBeam: laser,
          baseX: posX,
          baseZ: posZ,
          distFromCenter: dist,
          freqBin,
          height: 0.5,
          targetHeight: 0.5,
        });

        this.group.add(mesh);
      }
    }
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    const freqArr = audio.frequencyArray;

    for (let i = 0; i < this.towers.length; i++) {
      const tower = this.towers[i];

      // Calculate tower height based on its frequency bin and bass shockwaves
      const fVal = (freqArr[tower.freqBin % freqArr.length] || 0) / 255;
      const centerFactor = Math.max(0, 1.0 - tower.distFromCenter / 8.0);

      // Sub-bass drives center towers, mid/high drives outer towers
      const bassEnergy = audio.subBass * centerFactor * 4.5;
      const midEnergy = audio.mid * (1.0 - Math.abs(centerFactor - 0.5) * 2.0) * 3.5;
      const beatBoost = audio.isBeat ? audio.beatIntensity * 3.0 * centerFactor : 0;

      tower.targetHeight = 0.5 + (fVal * 4.0 + bassEnergy + midEnergy + beatBoost);
      // Smooth interpolation
      tower.height += (tower.targetHeight - tower.height) * 0.25;

      tower.mesh.scale.set(1.0, tower.height, 1.0);
      tower.mesh.position.y = -2.5 + tower.height / 2;

      // Update material color based on height & active palette
      const mat = tower.mesh.material as THREE.MeshStandardMaterial;
      const colorRatio = Math.min(1.0, tower.height / 7.0);

      if (colorRatio > 0.6) {
        mat.color.set(palette.accent);
        mat.emissive.set(palette.glow);
      } else if (colorRatio > 0.3) {
        mat.color.set(palette.secondary);
        mat.emissive.set(palette.secondary);
      } else {
        mat.color.set(palette.primary);
        mat.emissive.set(palette.primary);
      }

      mat.emissiveIntensity = 0.4 + colorRatio * 1.6;

      // Trigger vertical laser beams on high spikes
      if (tower.laserBeam) {
        if (tower.height > 4.5 || (audio.isBeat && tower.distFromCenter < 4.0)) {
          tower.laserBeam.visible = true;
          (tower.laserBeam.material as THREE.LineBasicMaterial).opacity = Math.min(1.0, (tower.height - 4.0) / 2.0 + 0.3);
          (tower.laserBeam.material as THREE.LineBasicMaterial).color.set(palette.accent);
        } else {
          tower.laserBeam.visible = false;
        }
      }
    }

    // Grid floor pulse
    (this.gridFloor.material as THREE.LineBasicMaterial).color.set(palette.primary);
  }

  public dispose(): void {
    this.towers.forEach((t) => {
      t.mesh.geometry.dispose();
      (t.mesh.material as THREE.Material).dispose();
      t.wire.geometry.dispose();
      (t.wire.material as THREE.Material).dispose();
      if (t.laserBeam) {
        t.laserBeam.geometry.dispose();
        (t.laserBeam.material as THREE.Material).dispose();
      }
    });
    this.gridFloor.geometry.dispose();
    (this.gridFloor.material as THREE.Material).dispose();
  }
}
