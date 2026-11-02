import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { AudioVisualizerCanvas } from './components/AudioVisualizerCanvas';
import { TopBar, TopBarHandle } from './components/TopBar';
import { AudioStatsHUD, AudioStatsHUDHandle } from './components/AudioStatsHUD';
import { ControlDock } from './components/ControlDock';
import {
  AudioAnalysisData,
  AudioSourceType,
  SynthPreset,
  VisualizerSettings,
} from './types/visualizer';
import { Mic, Music, Sparkles, X, Play, Square } from 'lucide-react';

export default function App() {
  const audioEngine = useMemo(() => new AudioEngine(), []);

  const [settings, setSettings] = useState<VisualizerSettings>({
    mode: 'waves', // Default to smooth, hypnotic Neon Wave Ocean
    palette: 'cyberpunk',
    sensitivity: 2.8,
    glowIntensity: 0.6, // Calibrated safe glow - NO white blowout
    rotationSpeed: 0.8,
    particleCount: 1.0,
    screenShake: true,
    autoRotate: true,
    bloomEnabled: true,
  });

  const [currentSource, setCurrentSource] = useState<AudioSourceType>('synth');
  const [synthPreset, setSynthPreset] = useState<SynthPreset>('ambient-space');
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [autoGain, setAutoGain] = useState<boolean>(true);

  // Use refs for zero-overhead audio telemetry (no React re-renders)
  const hudRef = useRef<AudioStatsHUDHandle | null>(null);
  const topBarRef = useRef<TopBarHandle | null>(null);

  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [screenshotFn, setScreenshotFn] = useState<(() => string) | null>(null);

  // High performance direct telemetry callback
  const handleAudioTick = useCallback((data: AudioAnalysisData) => {
    hudRef.current?.update(data);
    topBarRef.current?.updateVu(data.overallEnergy);
  }, []);

  // Sync sensitivity and AGC with audioEngine
  useEffect(() => {
    audioEngine.setSensitivity(settings.sensitivity);
  }, [audioEngine, settings.sensitivity]);

  useEffect(() => {
    audioEngine.setAutoGain(autoGain);
  }, [audioEngine, autoGain]);

  // Handle Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  }, []);

  // Stop audio
  const handleStopAudio = useCallback(() => {
    audioEngine.getSynth().stop();
    setIsAudioActive(false);
  }, [audioEngine]);

  // Play procedural synth preset
  const handlePlaySynth = useCallback(async (preset: SynthPreset = synthPreset) => {
    setShowIntro(false);
    setSynthPreset(preset);
    await audioEngine.enableSynth(preset);
    setCurrentSource('synth');
    setIsAudioActive(true);
    setMicError(null);
  }, [audioEngine, synthPreset]);

  // Enable live microphone
  const handleEnableMic = useCallback(async () => {
    setShowIntro(false);
    const success = await audioEngine.enableMicrophone();
    if (success) {
      setCurrentSource('mic');
      setIsAudioActive(true);
      setMicError(null);
    } else {
      setMicError(audioEngine.getMicPermissionError() || 'Доступ к микрофону заблокирован в браузере');
    }
  }, [audioEngine]);

  // Keyboard shortcuts: Space (toggle Stop/Play), H (hide HUD), F (fullscreen), Escape (close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isAudioActive) {
          handleStopAudio();
        } else {
          if (currentSource === 'mic') handleEnableMic();
          else handlePlaySynth(synthPreset);
        }
      } else if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
        setIsHudVisible((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        setShowIntro(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, isAudioActive, currentSource, synthPreset, handleStopAudio, handleEnableMic, handlePlaySynth]);

  // Load custom audio file
  const handleFileUpload = async (file: File) => {
    setShowIntro(false);
    await audioEngine.loadAudioFile(file);
    setCurrentSource('file');
    setIsAudioActive(true);
  };

  // Take screenshot & trigger download
  const handleTakeScreenshot = useCallback(() => {
    if (!screenshotFn) return;
    try {
      const dataUrl = screenshotFn();
      const link = document.createElement('a');
      link.download = `aether-beats-${settings.mode}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn('Screenshot error:', err);
    }
  }, [screenshotFn, settings.mode]);

  const handleScreenshotReady = useCallback((fn: () => string) => {
    setScreenshotFn(() => fn);
  }, []);

  const handleUpdateSettings = useCallback((partial: Partial<VisualizerSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer with Calibrated Glow and OrbitControls */}
      <AudioVisualizerCanvas
        audioEngine={audioEngine}
        settings={settings}
        onAudioTick={handleAudioTick}
        onScreenshotReady={handleScreenshotReady}
      />

      {/* Top Bar Header with Clear Stop / Play Master Button */}
      {isHudVisible && (
        <TopBar
          ref={topBarRef}
          currentSource={currentSource}
          isFullscreen={isFullscreen}
          isHudVisible={isHudVisible}
          onToggleFullscreen={toggleFullscreen}
          onToggleHud={() => setIsHudVisible(!isHudVisible)}
          onTakeScreenshot={handleTakeScreenshot}
          onEnableMic={handleEnableMic}
          onPlayPreset={() => handlePlaySynth(synthPreset)}
          onStopAudio={handleStopAudio}
          isAudioActive={isAudioActive}
        />
      )}

      {/* Frequency Spectrum HUD */}
      <AudioStatsHUD ref={hudRef} isVisible={isHudVisible} />

      {/* Collapsible Bottom Control Dock with 9 Modes */}
      {isHudVisible && (
        <ControlDock
          settings={settings}
          currentSource={currentSource}
          synthPreset={synthPreset}
          isAudioActive={isAudioActive}
          micError={micError}
          autoGain={autoGain}
          onUpdateSettings={handleUpdateSettings}
          onToggleAutoGain={setAutoGain}
          onEnableMic={handleEnableMic}
          onSelectSynthPreset={(preset) => handlePlaySynth(preset)}
          onStopAudio={handleStopAudio}
          onFileUpload={handleFileUpload}
        />
      )}

      {/* Floating Zen Mode button when HUD is hidden */}
      {!isHudVisible && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          {/* Quick stop/play button even in Zen Mode */}
          <button
            onClick={isAudioActive ? handleStopAudio : () => handlePlaySynth(synthPreset)}
            className={`p-2 rounded-full border shadow-xl transition-all ${
              isAudioActive
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-emerald-500 text-slate-950 border-emerald-400'
            }`}
            title={isAudioActive ? 'Остановить звук' : 'Запустить звук'}
          >
            {isAudioActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={() => setIsHudVisible(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white glass-panel-subtle rounded-full border border-white/10 hover:border-white/30 transition-all shadow-xl"
            title="Показать меню управления (H)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Меню (H)</span>
          </button>
        </div>
      )}

      {/* Welcome / Sound Activation Overlay on First Load */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 border border-white/15 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col gap-5">
            <button
              onClick={() => setShowIntro(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-1.5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-1">
                AETHER·BEATS
              </h1>
              <p className="text-sm text-slate-300">
                Футуристические 3D фигуры и плавные волны, реагирующие на речь, медленную музыку и любые звуки.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleEnableMic}
                className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all transform hover:scale-[1.02]"
              >
                <Mic className="w-5 h-5" />
                <span>Слушать Микрофон</span>
              </button>

              <button
                onClick={() => handlePlaySynth('ambient-space')}
                className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all transform hover:scale-[1.02]"
              >
                <Music className="w-5 h-5" />
                <span>Запустить Эмбиент</span>
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-400 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">Медленная музыка и голос:</strong> Плавные шелковые волны и струны арфы вибрируют от любых нот, пения и речи.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">360° Вращение:</strong> Зажмите мышь или палец на экране и свободно вращайте фигуры под любым углом.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">Пауза и Стоп:</strong> Большая кнопка СТОП в верхнем меню или клавиша <kbd className="px-1 bg-white/10 rounded font-mono text-slate-300">Пробел</kbd>.
                </span>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-500">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-slate-300">Пробел</kbd> Пауза/Старт · <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-slate-300">H</kbd> скрыть меню · <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-slate-300">F</kbd> экран
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
