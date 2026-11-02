import * as THREE from 'three';
import { ColorPalette, ColorPaletteId } from '../types/visualizer';

export const COLOR_PALETTES: Record<ColorPaletteId, ColorPalette> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Киберпанк Неон',
    primary: '#00f0ff',
    secondary: '#ff007f',
    accent: '#ffe600',
    background: '#030712',
    glow: '#00f0ff',
    rgbPrimary: [0, 240 / 255, 1],
    rgbSecondary: [1, 0, 127 / 255],
    rgbAccent: [1, 230 / 255, 0],
  },
  biolum: {
    id: 'biolum',
    name: 'Биолюминесценция',
    primary: '#00f5d4',
    secondary: '#7b2cbf',
    accent: '#00bbf9',
    background: '#020b14',
    glow: '#00f5d4',
    rgbPrimary: [0, 245 / 255, 212 / 255],
    rgbSecondary: [123 / 255, 44 / 255, 191 / 255],
    rgbAccent: [0, 187 / 255, 249 / 255],
  },
  synthwave: {
    id: 'synthwave',
    name: 'Синтвейв Закат',
    primary: '#ff2a85',
    secondary: '#ff7700',
    accent: '#a855f7',
    background: '#0a0314',
    glow: '#ff2a85',
    rgbPrimary: [1, 42 / 255, 133 / 255],
    rgbSecondary: [1, 119 / 255, 0],
    rgbAccent: [168 / 255, 85 / 255, 247 / 255],
  },
  quantumGold: {
    id: 'quantumGold',
    name: 'Квантовое Золото',
    primary: '#ffd166',
    secondary: '#f77f00',
    accent: '#ef476f',
    background: '#0d0803',
    glow: '#ffd166',
    rgbPrimary: [1, 209 / 255, 102 / 255],
    rgbSecondary: [247 / 255, 127 / 255, 0],
    rgbAccent: [239 / 255, 71 / 255, 111 / 255],
  },
  matrix: {
    id: 'matrix',
    name: 'Матричный Фосфор',
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#06b6d4',
    background: '#021008',
    glow: '#10b981',
    rgbPrimary: [16 / 255, 185 / 255, 129 / 255],
    rgbSecondary: [52 / 255, 211 / 255, 153 / 255],
    rgbAccent: [6 / 255, 182 / 255, 212 / 255],
  },
  supernova: {
    id: 'supernova',
    name: 'Супернова Спектрум',
    primary: '#38bdf8',
    secondary: '#ec4899',
    accent: '#eab308',
    background: '#040717',
    glow: '#f43f5e',
    rgbPrimary: [56 / 255, 189 / 255, 248 / 255],
    rgbSecondary: [236 / 255, 72 / 255, 153 / 255],
    rgbAccent: [234 / 255, 179 / 255, 8 / 255],
  },
};

export function getThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function lerpColors(c1: THREE.Color, c2: THREE.Color, alpha: number, target: THREE.Color): THREE.Color {
  return target.copy(c1).lerp(c2, alpha);
}
