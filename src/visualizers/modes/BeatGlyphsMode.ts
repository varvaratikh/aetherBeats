import * as THREE from 'three';
import { AudioAnalysisData, ColorPalette, VisualizerSettings } from '../../types/visualizer';

interface ActiveGlyph {
  group: THREE.Group;
  scale: number;
  maxScale: number;
  growthRate: number;
  rotSpeed: number;
  rotZ: number;
  zDepth: number;
  life: number;
  maxLife: number;
  type: number;
}

/**
 * Beat Glyphs & Cyber Matrix Mode
 * Spawns holographic geometric glyphs, laser rings, and futuristic runes
 * in direct response to transient beats, vocal spikes, and rhythm.
 */
export class BeatGlyphsMode {
  public group: THREE.Group;
  private activeGlyphs: ActiveGlyph[] = [];
  private coreGroup: THREE.Group;
  private radarLines: THREE.LineSegments;
  private time: number = 0;
  private lastSpawnTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.coreGroup = new THREE.Group();
    this.group.add(this.coreGroup);

    // Central holographic data core: 3 nested futuristic circular reticles
    this.initCore();

    // Radar scan lines
    const radarGeo = new THREE.BufferGeometry();
    const radarPts = new Float32Array(64 * 3);
    for (let i = 0; i < 64; i += 2) {
      const a = (i / 64) * Math.PI * 2;
      radarPts[i * 3] = Math.cos(a) * 0.8;
      radarPts[i * 3 + 1] = Math.sin(a) * 0.8;
      radarPts[i * 3 + 2] = 0;

      radarPts[(i + 1) * 3] = Math.cos(a) * 1.8;
      radarPts[(i + 1) * 3 + 1] = Math.sin(a) * 1.8;
      radarPts[(i + 1) * 3 + 2] = 0;
    }
    radarGeo.setAttribute('position', new THREE.BufferAttribute(radarPts, 3));
    this.radarLines = new THREE.LineSegments(
      radarGeo,
      new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      })
    );
    this.coreGroup.add(this.radarLines);
  }

  private initCore(): void {
    // Reticle 1: Octagon
    const octGeo = new THREE.BufferGeometry();
    const octPts = new Float32Array(9 * 3);
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      octPts[i * 3] = Math.cos(a) * 2.0;
      octPts[i * 3 + 1] = Math.sin(a) * 2.0;
      octPts[i * 3 + 2] = 0;
    }
    octGeo.setAttribute('position', new THREE.BufferAttribute(octPts, 3));
    const octMesh = new THREE.LineLoop(octGeo, new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    }));
    this.coreGroup.add(octMesh);

    // Reticle 2: Segmented circular ring
    const segGeo = new THREE.RingGeometry(2.6, 2.7, 32, 1, 0, Math.PI * 1.6);
    const segWire = new THREE.WireframeGeometry(segGeo);
    const segMesh = new THREE.LineSegments(segWire, new THREE.LineBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    }));
    this.coreGroup.add(segMesh);
  }

  private createGlyphMesh(type: number, color: THREE.Color): THREE.Group {
    const glyph = new THREE.Group();

    if (type === 0) {
      // Hexagonal targeting ring with 6 radial laser ticks
      const hexGeo = new THREE.BufferGeometry();
      const pts = new Float32Array(7 * 3);
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        pts[i * 3] = Math.cos(a);
        pts[i * 3 + 1] = Math.sin(a);
        pts[i * 3 + 2] = 0;
      }
      hexGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const hexLine = new THREE.LineLoop(hexGeo, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }));
      glyph.add(hexLine);

      // Inner tick marks
      const tickGeo = new THREE.BufferGeometry();
      const tickPts = new Float32Array(12 * 3);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        tickPts[i * 6] = Math.cos(a) * 0.75;
        tickPts[i * 6 + 1] = Math.sin(a) * 0.75;
        tickPts[i * 6 + 2] = 0;
        tickPts[i * 6 + 3] = Math.cos(a) * 0.95;
        tickPts[i * 6 + 4] = Math.sin(a) * 0.95;
        tickPts[i * 6 + 5] = 0;
      }
      tickGeo.setAttribute('position', new THREE.BufferAttribute(tickPts, 3));
      glyph.add(new THREE.LineSegments(tickGeo, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })));
    } else if (type === 1) {
      // Sacred Triangle Hologram with inner concentric rings
      const triGeo = new THREE.BufferGeometry();
      const triPts = new Float32Array(4 * 3);
      for (let i = 0; i <= 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        triPts[i * 3] = Math.cos(a) * 1.2;
        triPts[i * 3 + 1] = Math.sin(a) * 1.2;
        triPts[i * 3 + 2] = 0;
      }
      triGeo.setAttribute('position', new THREE.BufferAttribute(triPts, 3));
      glyph.add(new THREE.LineLoop(triGeo, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })));

      // Inverted second triangle (Merkaba star 2D)
      const tri2Geo = new THREE.BufferGeometry();
      const tri2Pts = new Float32Array(4 * 3);
      for (let i = 0; i <= 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
        tri2Pts[i * 3] = Math.cos(a) * 1.2;
        tri2Pts[i * 3 + 1] = Math.sin(a) * 1.2;
        tri2Pts[i * 3 + 2] = 0;
      }
      tri2Geo.setAttribute('position', new THREE.BufferAttribute(tri2Pts, 3));
      glyph.add(new THREE.LineLoop(tri2Geo, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })));
    } else if (type === 2) {
      // Cyber Runic 12-gon with Crosshairs
      const polyGeo = new THREE.BufferGeometry();
      const sides = 12;
      const polyPts = new Float32Array((sides + 1) * 3);
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        polyPts[i * 3] = Math.cos(a);
        polyPts[i * 3 + 1] = Math.sin(a);
        polyPts[i * 3 + 2] = 0;
      }
      polyGeo.setAttribute('position', new THREE.BufferAttribute(polyPts, 3));
      glyph.add(new THREE.LineLoop(polyGeo, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })));

      // Crosshairs
      const chGeo = new THREE.BufferGeometry();
      const chPts = new Float32Array([
        -1.3, 0, 0, 1.3, 0, 0,
        0, -1.3, 0, 0, 1.3, 0
      ]);
      chGeo.setAttribute('position', new THREE.BufferAttribute(chPts, 3));
      glyph.add(new THREE.LineSegments(chGeo, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      })));
    } else {
      // Holographic Diamond Cube Wireframe
      const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const wireGeo = new THREE.WireframeGeometry(boxGeo);
      glyph.add(new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })));
    }

    return glyph;
  }

  public update(delta: number, audio: AudioAnalysisData, palette: ColorPalette, settings: VisualizerSettings): void {
    this.time += delta;

    // Check beat or high energy transient for spawning
    const now = performance.now();
    const canSpawn = now - this.lastSpawnTime > 140;

    if ((audio.isBeat || (audio.overallEnergy > 0.45 && Math.random() < 0.2)) && canSpawn) {
      this.lastSpawnTime = now;
      const glyphType = Math.floor(Math.random() * 4);
      const colorHex = Math.random() > 0.5 ? palette.primary : (Math.random() > 0.5 ? palette.secondary : palette.accent);
      const color = new THREE.Color(colorHex);

      const glyphMesh = this.createGlyphMesh(glyphType, color);
      const initialScale = 0.5 + audio.beatIntensity * 0.4;
      glyphMesh.scale.set(initialScale, initialScale, initialScale);
      glyphMesh.position.set(0, 0, (Math.random() - 0.5) * 1.5);
      this.group.add(glyphMesh);

      this.activeGlyphs.push({
        group: glyphMesh,
        scale: initialScale,
        maxScale: 6.5 + Math.random() * 4.0,
        growthRate: 3.5 + audio.beatIntensity * 4.5,
        rotSpeed: (Math.random() - 0.5) * 2.0,
        rotZ: Math.random() * Math.PI,
        zDepth: glyphMesh.position.z,
        life: 1.0,
        maxLife: 1.2 + Math.random() * 0.8,
        type: glyphType,
      });
    }

    // Update active glyphs
    for (let i = this.activeGlyphs.length - 1; i >= 0; i--) {
      const g = this.activeGlyphs[i];
      g.life -= delta / g.maxLife;
      g.scale += delta * g.growthRate;
      g.rotZ += delta * g.rotSpeed;

      g.group.scale.set(g.scale, g.scale, g.scale);
      g.group.rotation.z = g.rotZ;

      // Fade opacity
      const opacity = Math.max(0, g.life);
      g.group.children.forEach((c) => {
        const line = c as THREE.Line;
        if (line.material) {
          (line.material as THREE.LineBasicMaterial).opacity = opacity;
        }
      });

      if (g.life <= 0 || g.scale >= g.maxScale) {
        // Remove and dispose
        this.group.remove(g.group);
        g.group.children.forEach((c) => {
          const line = c as THREE.Line;
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
        });
        this.activeGlyphs.splice(i, 1);
      }
    }

    // Update Core Reticles
    this.coreGroup.rotation.z = this.time * 0.6 * settings.rotationSpeed;
    const coreScale = 1.0 + audio.subBass * 0.4 + (audio.isBeat ? 0.3 : 0);
    this.coreGroup.scale.set(coreScale, coreScale, coreScale);

    // Update colors
    this.coreGroup.children.forEach((c, idx) => {
      const m = c as THREE.Line;
      if (m.material) {
        (m.material as THREE.LineBasicMaterial).color.set(idx % 2 === 0 ? palette.primary : palette.accent);
      }
    });
  }

  public dispose(): void {
    this.activeGlyphs.forEach((g) => {
      this.group.remove(g.group);
      g.group.children.forEach((c) => {
        const line = c as THREE.Line;
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
    });
    this.activeGlyphs = [];

    this.coreGroup.children.forEach((c) => {
      const line = c as THREE.Line;
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
  }
}
