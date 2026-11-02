import React, { useState } from 'react';
import {
  AudioSourceType,
  ColorPaletteId,
  SynthPreset,
  VisualizerMode,
  VisualizerSettings,
} from '../types/visualizer';
import { COLOR_PALETTES } from '../visualizers/ColorPalettes';
import {
  ChevronDown,
  ChevronUp,
  Mic,
  Music,
  FolderOpen,
  Layers,
  Palette,
  Sliders,
  Square,
  Play,
  RotateCw,
  Sparkles,
} from 'lucide-react';

interface ControlDockProps {
  settings: VisualizerSettings;
  currentSource: AudioSourceType;
  synthPreset: SynthPreset;
  isAudioActive: boolean;
  micError: string | null;
  autoGain: boolean;
  onUpdateSettings: (newSettings: Partial<VisualizerSettings>) => void;
  onToggleAutoGain: (enabled: boolean) => void;
  onEnableMic: () => void;
  onSelectSynthPreset: (preset: SynthPreset) => void;
  onStopAudio: () => void;
  onFileUpload: (file: File) => void;
}

type TabKey = 'modes' | 'source' | 'palettes' | 'settings';

export const ControlDock: React.FC<ControlDockProps> = ({
  settings,
  currentSource,
  synthPreset,
  isAudioActive,
  micError,
  autoGain,
  onUpdateSettings,
  onToggleAutoGain,
  onEnableMic,
  onSelectSynthPreset,
  onStopAudio,
  onFileUpload,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('modes');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const MODES: { id: VisualizerMode; label: string; desc: string }[] = [
    { id: 'waves', label: 'Океан Волн', desc: 'Шелковые 3D волны под медленную музыку и ноты' },
    { id: 'strings', label: 'Струны Резонанса', desc: 'Вибрирующие струны арфы под мелодию и речь' },
    { id: 'spirograph', label: 'Калейдоскоп', desc: 'Параметрические узоры и линии Лиссажу' },
    { id: 'wormhole', label: 'Кибер-Вортекс', desc: 'Вращающаяся спиральная червоточина' },
    { id: 'tunnel', label: 'Варп-Тоннель', desc: 'Неоновый полигональный тоннель вглубь' },
    { id: 'mandala', label: 'Кибер-Сфера', desc: 'Жидкая 3D плазма и сакральный лотос' },
    { id: 'torus', label: 'Квантовый Торус', desc: 'Тороидальный реактор и кольца Сатурна' },
    { id: 'dna', label: 'Спираль ДНК', desc: 'Квантовая био-спираль с импульсами нот' },
    { id: 'nebula', label: 'Квантовая Небула', desc: '20,000 светящихся частиц и пульсар' },
  ];

  const SYNTH_PRESETS: { id: SynthPreset; label: string; desc: string }[] = [
    { id: 'ambient-space', label: 'Медленный Эмбиент', desc: 'Мягкий космический дрон и аккорды' },
    { id: 'cyber-beat', label: 'Кибер-Бит', desc: 'Электронный бас 126 BPM' },
    { id: 'vocal-synth', label: 'Синтез Речи', desc: 'Форманты гласных (А-О-И)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ease-out ${
        isCollapsed
          ? 'bottom-2 left-1/2 -translate-x-1/2'
          : 'bottom-4 left-1/2 -translate-x-1/2 w-[min(980px,96vw)]'
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium text-slate-300 hover:text-white glass-panel-subtle rounded-full border border-white/10 hover:border-white/25 transition-all shadow-lg"
          title={isCollapsed ? 'Развернуть панель управления (H)' : 'Свернуть панель управления (H)'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Показать панель управления</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Скрыть панель</span>
            </>
          )}
        </button>
      </div>

      {/* Main Expanded Dock Content */}
      {!isCollapsed && (
        <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl p-4 flex flex-col gap-3">
          {/* Sub-tabs header */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('modes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'modes'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Фигуры & Волны (9)</span>
              </button>

              <button
                onClick={() => setActiveTab('source')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'source'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Звук & Усиление</span>
              </button>

              <button
                onClick={() => setActiveTab('palettes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'palettes'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Неоновые Палитры</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>360° Камера & Свечение</span>
              </button>
            </div>

            {/* Obvious Play / Stop Quick Action */}
            <div className="flex items-center gap-2 shrink-0">
              {isAudioActive ? (
                <button
                  onClick={onStopAudio}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg shadow transition-all whitespace-nowrap"
                  title="Остановить звук"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Стоп</span>
                </button>
              ) : (
                <button
                  onClick={currentSource === 'mic' ? onEnableMic : () => onSelectSynthPreset(synthPreset)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow transition-all whitespace-nowrap"
                  title="Запустить звук"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Старт</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Modes (9 Modes: Waves, Strings, Spirograph, Wormhole, Tunnel, etc.) */}
          {activeTab === 'modes' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {MODES.map((m) => {
                const isActive = settings.mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => onUpdateSettings({ mode: m.id })}
                    className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-gradient-to-b from-cyan-500/25 to-pink-500/15 border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.35)]'
                        : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {m.label}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Audio Source & Sensitivity */}
          {activeTab === 'source' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Live Microphone */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>Микрофон (Живой Звук)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Слушает речь, спокойное пение, дыхание, свист или музыку в комнате.
                    </p>
                  </div>
                  {micError && (
                    <div className="text-[11px] text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                      {micError}
                    </div>
                  )}
                  <button
                    onClick={onEnableMic}
                    className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${
                      currentSource === 'mic' && isAudioActive
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.6)]'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {currentSource === 'mic' && isAudioActive ? 'Микрофон слушает...' : 'Включить Микрофон'}
                  </button>
                </div>

                {/* 2. Built-in Synth Presets */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Music className="w-4 h-4 text-pink-400" />
                      <span>Встроенная Музыка</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Медленный эмбиент, космические аккорды или ритмичные биты.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {SYNTH_PRESETS.map((p) => {
                      const isCur = currentSource === 'synth' && synthPreset === p.id && isAudioActive;
                      return (
                        <button
                          key={p.id}
                          onClick={() => onSelectSynthPreset(p.id)}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg transition-all text-center ${
                            isCur
                              ? 'bg-pink-500 text-white font-semibold shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                              : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
                          }`}
                          title={p.desc}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Audio File Upload */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <FolderOpen className="w-4 h-4 text-amber-400" />
                      <span>Свой Музыкальный Трек</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Загрузите любой любимый трек MP3/WAV/OGG с компьютера.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Выбрать аудиофайл</span>
                  </button>
                </div>
              </div>

              {/* Sensitivity Boost & AGC Controls */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-200">
                    Усиление микрофона:
                  </span>
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <input
                      type="range"
                      min="0.5"
                      max="8.0"
                      step="0.2"
                      value={settings.sensitivity}
                      onChange={(e) => onUpdateSettings({ sensitivity: parseFloat(e.target.value) })}
                      className="w-36 accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono-numbers text-cyan-300 font-bold min-w-10">
                      {settings.sensitivity.toFixed(1)}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Авто-нормализация (AGC):</span>
                  <button
                    onClick={() => onToggleAutoGain(!autoGain)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      autoGain
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {autoGain ? 'ВКЛЮЧЕНО' : 'ВЫКЛ'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Color Palettes */}
          {activeTab === 'palettes' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {(Object.keys(COLOR_PALETTES) as ColorPaletteId[]).map((palId) => {
                const pal = COLOR_PALETTES[palId];
                const isSelected = settings.palette === palId;
                return (
                  <button
                    key={palId}
                    onClick={() => onUpdateSettings({ palette: palId })}
                    className={`flex flex-col p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-cyan-400 bg-white/10 shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                        : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: pal.primary }} />
                      <span className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: pal.secondary }} />
                      <span className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: pal.accent }} />
                    </div>
                    <span className="text-xs font-medium text-slate-200">{pal.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 4: 360 Camera & Calibrated Glow (No Whiteout) */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-1">
              {/* 360° Auto-Rotation Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>360° Вращение сцены</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Авто-орбита (или тяните мышью)
                  </span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    settings.autoRotate
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {settings.autoRotate ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>

              {/* Rotation Speed Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Скорость 360° вращения</span>
                  <span className="font-mono-numbers text-amber-300 font-bold">
                    {settings.rotationSpeed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={settings.rotationSpeed}
                  onChange={(e) => onUpdateSettings({ rotationSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Calibrated Bloom Intensity (safe range 0.2 to 1.5) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Мягкое свечение (без засветов)</span>
                  <span className="font-mono-numbers text-pink-300 font-bold">
                    {settings.glowIntensity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={settings.glowIntensity}
                  onChange={(e) => onUpdateSettings({ glowIntensity: parseFloat(e.target.value) })}
                  className="w-full accent-pink-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Screen Shake on Bass */}
              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-200 font-semibold">Ударная волна баса</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Вибрация на бит</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ screenShake: !settings.screenShake })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    settings.screenShake
                      ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {settings.screenShake ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
