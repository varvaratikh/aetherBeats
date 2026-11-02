import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { AudioAnalysisData } from '../types/visualizer';
import { Activity, Radio, Zap, Volume2 } from 'lucide-react';

export interface AudioStatsHUDHandle {
  update: (data: AudioAnalysisData) => void;
}

interface AudioStatsHUDProps {
  isVisible: boolean;
}

export const AudioStatsHUD = forwardRef<AudioStatsHUDHandle, AudioStatsHUDProps>(
  ({ isVisible }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const vuBarRef = useRef<HTMLDivElement | null>(null);
    const vuTextRef = useRef<HTMLSpanElement | null>(null);
    const subBassRef = useRef<HTMLDivElement | null>(null);
    const midRef = useRef<HTMLDivElement | null>(null);
    const trebleRef = useRef<HTMLDivElement | null>(null);
    const freqRef = useRef<HTMLSpanElement | null>(null);
    const beatBadgeRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      update: (data: AudioAnalysisData) => {
        if (!isVisible) return;

        // 1. Draw spectrum on canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const freq = data.frequencyArray;
            if (freq && freq.length > 0) {
              const barCount = 32;
              const barWidth = width / barCount - 1.5;
              const step = Math.floor(freq.length / (barCount * 2));

              for (let i = 0; i < barCount; i++) {
                const val = freq[i * step] / 255;
                const barHeight = Math.max(3, val * height);

                const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
                grad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
                grad.addColorStop(0.5, 'rgba(0, 240, 255, 0.9)');
                grad.addColorStop(1, 'rgba(255, 0, 127, 0.95)');

                ctx.fillStyle = grad;
                ctx.fillRect(i * (barWidth + 1.5), height - barHeight, barWidth, barHeight);
              }
            }
          }
        }

        // 2. Direct DOM updates for zero React re-renders
        const energyPct = Math.round(data.overallEnergy * 100);
        if (vuBarRef.current) {
          vuBarRef.current.style.width = `${Math.min(100, energyPct)}%`;
        }
        if (vuTextRef.current) {
          vuTextRef.current.textContent = `${energyPct}%`;
        }
        if (subBassRef.current) {
          subBassRef.current.textContent = `${Math.round(data.subBass * 100)}%`;
        }
        if (midRef.current) {
          midRef.current.textContent = `${Math.round(data.mid * 100)}%`;
        }
        if (trebleRef.current) {
          trebleRef.current.textContent = `${Math.round(data.treble * 100)}%`;
        }
        if (freqRef.current) {
          freqRef.current.textContent = data.dominantFrequency > 0 ? `${data.dominantFrequency} Гц` : '—';
        }
        if (beatBadgeRef.current) {
          if (data.isBeat) {
            beatBadgeRef.current.className =
              'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-numbers transition-colors bg-pink-500/40 text-pink-200 font-bold border border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]';
            beatBadgeRef.current.lastElementChild!.textContent = 'БИТ ДРОП';
          } else {
            beatBadgeRef.current.className =
              'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-numbers transition-colors bg-white/5 text-slate-400';
            beatBadgeRef.current.lastElementChild!.textContent = 'ОЖИДАНИЕ';
          }
        }
      },
    }));

    if (!isVisible) return null;

    return (
      <aside
        aria-label="Аудио телеметрия"
        className="fixed top-18 right-6 z-30 hidden md:flex flex-col gap-2.5 p-3.5 glass-panel rounded-2xl w-68 border border-white/10 shadow-2xl transition-all duration-300 pointer-events-none"
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Спектр & Детектор</span>
          </div>
          <div
            ref={beatBadgeRef}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-numbers transition-colors bg-white/5 text-slate-400"
          >
            <Zap className="w-2.5 h-2.5" />
            <span>ОЖИДАНИЕ</span>
          </div>
        </div>

        {/* Mini Spectrum Canvas */}
        <div className="w-full h-12 bg-black/60 rounded-lg p-1 border border-white/5 overflow-hidden">
          <canvas ref={canvasRef} width={240} height={44} className="w-full h-full block" />
        </div>

        {/* Live VU Input Level Meter */}
        <div className="flex flex-col gap-1 bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Входной уровень звука</span>
            </span>
            <span ref={vuTextRef} className="font-mono-numbers text-slate-200 font-semibold">
              0%
            </span>
          </div>
          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden flex">
            <div
              ref={vuBarRef}
              className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-cyan-400 to-emerald-400"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {/* Frequency Breakdown Metrics */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-400">САБ-БАС</div>
            <div ref={subBassRef} className="text-xs font-mono-numbers font-semibold text-cyan-300">
              0%
            </div>
          </div>

          <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-400">ГОЛОС / МИД</div>
            <div ref={midRef} className="text-xs font-mono-numbers font-semibold text-emerald-300">
              0%
            </div>
          </div>

          <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-400">ВЫСОКИЕ</div>
            <div ref={trebleRef} className="text-xs font-mono-numbers font-semibold text-pink-300">
              0%
            </div>
          </div>
        </div>

        {/* Dominant Pitch / Fundamental Note */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2 px-1">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>Тон голоса:</span>
          </span>
          <span ref={freqRef} className="font-mono-numbers text-slate-200">
            —
          </span>
        </div>
      </aside>
    );
  }
);
