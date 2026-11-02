import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { AudioAnalysisData, ColorPaletteId, VisualizerMode, VisualizerSettings } from '../types/visualizer';
import { COLOR_PALETTES } from './ColorPalettes';
import { HarmonicWavesMode } from './modes/HarmonicWavesMode';
import { ResonanceStringsMode } from './modes/ResonanceStringsMode';
import { SpirographMode } from './modes/SpirographMode';
import { WormholeMode } from './modes/WormholeMode';
import { WarpTunnelMode } from './modes/WarpTunnelMode';
import { CyberMandalaMode } from './modes/CyberMandalaMode';
import { QuantumTorusMode } from './modes/QuantumTorusMode';
import { DnaHelixMode } from './modes/DnaHelixMode';
import { QuantumNebulaMode } from './modes/QuantumNebulaMode';

export class ThreeVisualizer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private contentGroup: THREE.Group; // Group for objects so camera position stays pure for OrbitControls
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private clock: THREE.Clock;

  // Active Modes
  private wavesMode: HarmonicWavesMode | null = null;
  private stringsMode: ResonanceStringsMode | null = null;
  private spirographMode: SpirographMode | null = null;
  private wormholeMode: WormholeMode | null = null;
  private tunnelMode: WarpTunnelMode | null = null;
  private mandalaMode: CyberMandalaMode | null = null;
  private torusMode: QuantumTorusMode | null = null;
  private dnaMode: DnaHelixMode | null = null;
  private nebulaMode: QuantumNebulaMode | null = null;

  private currentModeId: VisualizerMode = 'waves';
  private currentPaletteId: ColorPaletteId = 'cyberpunk';
  private settings: VisualizerSettings;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private pointLight1: THREE.PointLight;
  private pointLight2: THREE.PointLight;

  // Screen shake
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeDecay: number = 0;
  private time: number = 0;

  constructor(container: HTMLElement, initialSettings: VisualizerSettings) {
    this.container = container;
    this.settings = initialSettings;
    this.currentModeId = initialSettings.mode;
    this.currentPaletteId = initialSettings.palette;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Deep Cosmic Background
    this.scene = new THREE.Scene();
    const palette = COLOR_PALETTES[this.currentPaletteId];
    this.scene.background = new THREE.Color(palette.background);
    this.scene.fog = new THREE.FogExp2(new THREE.Color(palette.background).getHex(), 0.02);

    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    this.camera.position.set(0, 4.0, 14.0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Calibrated exposure to prevent blown-out white screen:
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height);

    // Apply touch-action: none directly on the canvas element for flawless mobile/trackpad gestures
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(this.renderer.domElement);

    // Initialize OrbitControls for smooth 360° camera rotation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.autoRotate = this.settings.autoRotate;
    this.controls.autoRotateSpeed = 1.4 * this.settings.rotationSpeed;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 45.0;
    this.controls.target.set(0, 0, 0);

    // Setup Cinematic Bloom at half-resolution (saves 75% GPU fill rate and memory)
    try {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      // Half-res bloom texture saves memory and prevents GPU stutter
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(Math.floor(width / 2), Math.floor(height / 2)),
        this.settings.glowIntensity * 0.45,
        0.35,
        0.55
      );
      this.composer.addPass(this.bloomPass);

      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);
    } catch (err) {
      console.warn('Post-processing initialization error:', err);
      this.composer = null;
    }

    // Controlled Ambient & Point Lighting (no excessive light blowouts)
    this.ambientLight = new THREE.AmbientLight(0x0a1020, 0.5);
    this.scene.add(this.ambientLight);

    this.pointLight1 = new THREE.PointLight(palette.primary, 1.2, 30);
    this.pointLight1.position.set(6, 6, 6);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(palette.secondary, 1.0, 30);
    this.pointLight2.position.set(-6, -5, 5);
    this.scene.add(this.pointLight2);

    this.clock = new THREE.Clock();

    // Mount initial mode
    this.setMode(this.currentModeId);

    window.addEventListener('resize', this.onResize);
  }

  public setMode(mode: VisualizerMode): void {
    // Clear all existing modes
    if (this.wavesMode) {
      this.contentGroup.remove(this.wavesMode.group);
      this.wavesMode.dispose();
      this.wavesMode = null;
    }
    if (this.stringsMode) {
      this.contentGroup.remove(this.stringsMode.group);
      this.stringsMode.dispose();
      this.stringsMode = null;
    }
    if (this.spirographMode) {
      this.contentGroup.remove(this.spirographMode.group);
      this.spirographMode.dispose();
      this.spirographMode = null;
    }
    if (this.wormholeMode) {
      this.contentGroup.remove(this.wormholeMode.group);
      this.wormholeMode.dispose();
      this.wormholeMode = null;
    }
    if (this.tunnelMode) {
      this.contentGroup.remove(this.tunnelMode.group);
      this.tunnelMode.dispose();
      this.tunnelMode = null;
    }
    if (this.mandalaMode) {
      this.contentGroup.remove(this.mandalaMode.group);
      this.mandalaMode.dispose();
      this.mandalaMode = null;
    }
    if (this.torusMode) {
      this.contentGroup.remove(this.torusMode.group);
      this.torusMode.dispose();
      this.torusMode = null;
    }
    if (this.dnaMode) {
      this.contentGroup.remove(this.dnaMode.group);
      this.dnaMode.dispose();
      this.dnaMode = null;
    }
    if (this.nebulaMode) {
      this.contentGroup.remove(this.nebulaMode.group);
      this.nebulaMode.dispose();
      this.nebulaMode = null;
    }

    this.currentModeId = mode;

    switch (mode) {
      case 'waves':
        this.wavesMode = new HarmonicWavesMode();
        this.contentGroup.add(this.wavesMode.group);
        this.camera.position.set(0, 5.5, 13.0);
        this.controls.target.set(0, 0, 0);
        break;
      case 'strings':
        this.stringsMode = new ResonanceStringsMode();
        this.contentGroup.add(this.stringsMode.group);
        this.camera.position.set(0, 1.5, 12.0);
        this.controls.target.set(0, 0, 0);
        break;
      case 'spirograph':
        this.spirographMode = new SpirographMode();
        this.contentGroup.add(this.spirographMode.group);
        this.camera.position.set(0, 0, 11.5);
        this.controls.target.set(0, 0, 0);
        break;
      case 'wormhole':
        this.wormholeMode = new WormholeMode();
        this.contentGroup.add(this.wormholeMode.group);
        this.camera.position.set(0, 0, 1.0);
        this.controls.target.set(0, 0, -20);
        break;
      case 'tunnel':
        this.tunnelMode = new WarpTunnelMode();
        this.contentGroup.add(this.tunnelMode.group);
        this.camera.position.set(0, 0, 1.0);
        this.controls.target.set(0, 0, -20);
        break;
      case 'mandala':
        this.mandalaMode = new CyberMandalaMode();
        this.contentGroup.add(this.mandalaMode.group);
        this.camera.position.set(0, 1.5, 10.5);
        this.controls.target.set(0, 0, 0);
        break;
      case 'torus':
        this.torusMode = new QuantumTorusMode();
        this.contentGroup.add(this.torusMode.group);
        this.camera.position.set(0, 3.5, 11.0);
        this.controls.target.set(0, 0, 0);
        break;
      case 'dna':
        this.dnaMode = new DnaHelixMode();
        this.contentGroup.add(this.dnaMode.group);
        this.camera.position.set(0, 0, 13.5);
        this.controls.target.set(0, 0, 0);
        break;
      case 'nebula':
        this.nebulaMode = new QuantumNebulaMode();
        this.contentGroup.add(this.nebulaMode.group);
        this.camera.position.set(0, 4.0, 13.0);
        this.controls.target.set(0, 0, 0);
        break;
    }

    this.controls.autoRotate = this.settings.autoRotate;
    this.controls.autoRotateSpeed = 1.4 * this.settings.rotationSpeed;
    this.controls.update();
  }

  public setPalette(paletteId: ColorPaletteId): void {
    this.currentPaletteId = paletteId;
    const palette = COLOR_PALETTES[paletteId];
    if (palette) {
      this.scene.background = new THREE.Color(palette.background);
      if (this.scene.fog) {
        (this.scene.fog as THREE.FogExp2).color.set(palette.background);
      }
      this.pointLight1.color.set(palette.primary);
      this.pointLight2.color.set(palette.secondary);
    }
  }

  public updateSettings(newSettings: VisualizerSettings): void {
    if (newSettings.mode !== this.currentModeId) {
      this.setMode(newSettings.mode);
    }
    if (newSettings.palette !== this.currentPaletteId) {
      this.setPalette(newSettings.palette);
    }

    this.settings = newSettings;
    this.controls.autoRotate = newSettings.autoRotate;
    this.controls.autoRotateSpeed = 1.4 * newSettings.rotationSpeed;

    if (this.bloomPass) {
      this.bloomPass.strength = newSettings.bloomEnabled ? newSettings.glowIntensity * 0.45 : 0;
    }
  }

  public render(audio: AudioAnalysisData): void {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.time += delta;
    const palette = COLOR_PALETTES[this.currentPaletteId];

    // Sub-bass camera kick / screen shake applied safely to contentGroup, not camera
    if (this.settings.screenShake && audio.isBeat) {
      this.shakeDecay = audio.beatIntensity * 0.25;
    }
    if (this.shakeDecay > 0.001) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeDecay,
        (Math.random() - 0.5) * this.shakeDecay,
        (Math.random() - 0.5) * this.shakeDecay
      );
      this.shakeDecay *= 0.85;
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
    this.contentGroup.position.copy(this.shakeOffset);

    // OrbitControls updates camera position smoothly with 360° rotation & user gestures
    this.controls.update();

    // Subtle moving point lights
    this.pointLight1.position.x = Math.sin(this.time * 0.6) * 8;
    this.pointLight1.position.y = Math.cos(this.time * 0.5) * 6;
    this.pointLight1.intensity = 0.8 + audio.overallEnergy * 0.8;

    this.pointLight2.position.x = Math.cos(this.time * 0.5) * 8;
    this.pointLight2.position.z = Math.sin(this.time * 0.4) * 8;
    this.pointLight2.intensity = 0.7 + audio.treble * 0.7;

    // Controlled bloom modulation (never blows out to white!)
    if (this.bloomPass && this.settings.bloomEnabled) {
      const energyPulse = audio.overallEnergy * 0.2 + (audio.isBeat ? audio.beatIntensity * 0.3 : 0);
      this.bloomPass.strength = this.settings.glowIntensity * (0.35 + energyPulse);
    }

    // Update active visualizer mode
    if (this.wavesMode) this.wavesMode.update(delta, audio, palette, this.settings);
    if (this.stringsMode) this.stringsMode.update(delta, audio, palette, this.settings);
    if (this.spirographMode) this.spirographMode.update(delta, audio, palette, this.settings);
    if (this.wormholeMode) this.wormholeMode.update(delta, audio, palette, this.settings);
    if (this.tunnelMode) this.tunnelMode.update(delta, audio, palette, this.settings);
    if (this.mandalaMode) this.mandalaMode.update(delta, audio, palette, this.settings);
    if (this.torusMode) this.torusMode.update(delta, audio, palette, this.settings);
    if (this.dnaMode) this.dnaMode.update(delta, audio, palette, this.settings);
    if (this.nebulaMode) this.nebulaMode.update(delta, audio, palette, this.settings);

    if (this.composer && this.settings.bloomEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public takeScreenshot(): string {
    if (this.composer && this.settings.bloomEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    return this.renderer.domElement.toDataURL('image/png');
  }

  private onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  };

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);

    this.controls.dispose();

    if (this.wavesMode) this.wavesMode.dispose();
    if (this.stringsMode) this.stringsMode.dispose();
    if (this.spirographMode) this.spirographMode.dispose();
    if (this.wormholeMode) this.wormholeMode.dispose();
    if (this.tunnelMode) this.tunnelMode.dispose();
    if (this.mandalaMode) this.mandalaMode.dispose();
    if (this.torusMode) this.torusMode.dispose();
    if (this.dnaMode) this.dnaMode.dispose();
    if (this.nebulaMode) this.nebulaMode.dispose();

    if (this.composer) {
      this.composer.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
