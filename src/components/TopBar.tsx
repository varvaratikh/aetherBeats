import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Camera, Maximize, Minimize, Eye, EyeOff, Mic, Music, Sparkles, Volume2, Square, Play } from 'lucide-react';
import { AudioSourceType } from '../types/visualizer';

export interface TopBarHandle {
  updateVu: (overallEnergy: number) => void;
}

interface TopBarProps {
  currentSource: AudioSourceType;
  isFullscreen: boolean;
  isHudVisible: boolean;
  onToggleFullscreen: () => void;
  onToggleHud: () => void;
  onTakeScreenshot: () => void;
  onEnableMic: () => void;
  onPlayPreset: () => void;
  onStopAudio: () => void;
  isAudioActive: boolean;
}

export const TopBar = forwardRef<TopBarHandle, TopBarProps>(
  (
    {
      currentSource,
      isFullscreen,
      isHudVisible,
      onToggleFullscreen,
      onToggleHud,
      onTakeScreenshot,
      onEnableMic,
      onPlayPreset,
      onStopAudio,
      isAudioActive,
    },
    ref
  ) => {
    const miniVuRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      updateVu: (overallEnergy: number) => {
        if (miniVuRef.current) {
          miniVuRef.current.style.width = `${Math.min(100, Math.round(overallEnergy * 100))}%`;
        }
      },
    }));

    return (
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 glass-panel-subtle border-b border-white/10 transition-opacity duration-300">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm sm:text-base font-bold tracking-wider text-white uppercase whitespace-nowrap">
              AETHER·BEATS
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono-numbers -mt-0.5 hidden xs:block">
              Визуализатор звука & волн
            </span>
          </div>
        </div>

        {/* Zone 2: Master Play / Stop & Sound Source Controls */}
        <div className="flex items-center gap-2 p-1 px-2 bg-black/50 border border-white/15 rounded-xl">
          {isAudioActive ? (
            <button
              onClick={onStopAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg shadow-[0_0_14px_rgba(244,63,94,0.5)] transition-all whitespace-nowrap"
              title="Остановить / Пауза (Пробел)"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>СТОП</span>
            </button>
          ) : (
            <button
              onClick={currentSource === 'mic' ? onEnableMic : onPlayPreset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-[0_0_14px_rgba(16,185,129,0.5)] transition-all whitespace-nowrap"
              title="Запустить воспроизведение (Пробел)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>СТАРТ</span>
            </button>
          )}

          <button
            onClick={onEnableMic}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              currentSource === 'mic' && isAudioActive
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Слушать микрофон"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Микрофон</span>
          </button>

          <button
            onClick={onPlayPreset}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              currentSource === 'synth' && isAudioActive
                ? 'bg-pink-500 text-white font-bold shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Включить встроенный эмбиент/бит"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Демо-Биты</span>
          </button>

          {/* Mini VU bar updated directly without React state */}
          <div className="hidden md:flex items-center gap-1.5 pl-1.5 border-l border-white/10" title="Входная громкость звука">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <div className="w-14 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                ref={miniVuRef}
                className="h-full bg-cyan-400 rounded-full transition-all duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Zone 3: Primary Utility Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onTakeScreenshot}
            className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            title="Сделать снимок рисунка (PNG)"
            aria-label="Снимок арт-визуализации"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleHud}
            className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            title={isHudVisible ? 'Скрыть панели меню (H)' : 'Показать панели меню (H)'}
            aria-label="Переключить интерфейс"
          >
            {isHudVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран (F)'}
            aria-label="Полный экран"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>
    );
  }
);
