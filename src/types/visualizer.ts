/**
 * Visualizer Types and Data Structures
 */

export type VisualizerMode = 
  | 'waves'        // Неоновый Океан Волн (Harmonic Silk Sea - highly sensitive to slow melodies & voice)
  | 'strings'      // Струны Резонанса (Harmonic Laser Harp - vibrating standing waves)
  | 'spirograph'   // Квантовый Калейдоскоп (Hypnotic Spirograph & Lissajous Curves)
  | 'wormhole'     // Кибер-Вортекс (Rotating Spiral Fiber-Optic Tunnel)
  | 'tunnel'       // Варп-Тоннель (Infinite Polygonal Warp Corridor)
  | 'mandala'      // Кибер-Сфера & Лотос (Sacred Geometry & Morphing Sphere)
  | 'torus'        // Квантовый Торус & Реактор (Quantum Torus & Ring Reactor)
  | 'dna'          // Био-Квантовая Спираль ДНК (DNA Helix & Radiant Impulses)
  | 'nebula';      // Квантовая Небула (Cosmic Particle Vortex)

export type ColorPaletteId = 
  | 'cyberpunk'    // Cyan, Neon Magenta, Acid Yellow
  | 'biolum'       // Electric Aqua, Emerald Green, Violet
  | 'synthwave'    // Hot Pink, Sunset Orange, Deep Purple
  | 'quantumGold'  // Solar Amber, Bright Gold, Crimson Plasma
  | 'matrix'       // Phosphor Green, Cyber Mint, Deep Emerald
  | 'supernova';   // Rainbow Harmonic Spectrum

export interface ColorPalette {
  id: ColorPaletteId;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glow: string;
  rgbPrimary: [number, number, number];
  rgbSecondary: [number, number, number];
  rgbAccent: [number, number, number];
}

export type AudioSourceType = 'mic' | 'synth' | 'file';

export type SynthPreset = 'cyber-beat' | 'ambient-space' | 'vocal-synth';

export interface AudioAnalysisData {
  subBass: number;       // 20 - 70 Hz (0 to 1)
  bass: number;          // 70 - 250 Hz (0 to 1)
  mid: number;           // 250 - 2500 Hz (0 to 1)
  highMid: number;       // 2500 - 6000 Hz (0 to 1)
  treble: number;        // 6000 - 16000 Hz (0 to 1)
  overallEnergy: number; // RMS energy (0 to 1)
  peakEnergy: number;    // Peak frequency magnitude
  isBeat: boolean;       // Instantaneous beat pulse
  beatIntensity: number; // 0 to 1
  dominantFrequency: number; // in Hz (e.g. 130 Hz, 440 Hz)
  frequencyArray: Uint8Array<ArrayBuffer>;
  timeDomainArray: Uint8Array<ArrayBuffer>;
}

export interface VisualizerSettings {
  mode: VisualizerMode;
  palette: ColorPaletteId;
  sensitivity: number;   // 0.5 to 8.0 (audio gain boost)
  glowIntensity: number; // 0.2 to 1.5 (bloom / glow factor, calibrated to prevent white blowout)
  rotationSpeed: number; // 0.1 to 2.5
  particleCount: number; // detail level multiplier
  screenShake: boolean;  // reactive bass camera bump
  autoRotate: boolean;   // smooth continuous orbit rotation
  bloomEnabled: boolean; // cinematic post-processing bloom
}
