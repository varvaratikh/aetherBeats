import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { ThreeVisualizer } from '../visualizers/ThreeVisualizer';
import { AudioAnalysisData, VisualizerSettings } from '../types/visualizer';

interface AudioVisualizerCanvasProps {
  audioEngine: AudioEngine;
  settings: VisualizerSettings;
  onAudioTick: (data: AudioAnalysisData) => void;
  onScreenshotReady?: (takeScreenshotFn: () => string) => void;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  audioEngine,
  settings,
  onAudioTick,
  onScreenshotReady,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const visualizerRef = useRef<ThreeVisualizer | null>(null);
  const animFrameRef = useRef<number>(0);

  // Keep references fresh without tearing down WebGL or triggering re-mounts
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const onTickRef = useRef(onAudioTick);
  onTickRef.current = onAudioTick;

  const onScreenshotReadyRef = useRef(onScreenshotReady);
  onScreenshotReadyRef.current = onScreenshotReady;

  // Initialize ThreeVisualizer once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const visualizer = new ThreeVisualizer(mountRef.current, settingsRef.current);
    visualizerRef.current = visualizer;

    if (onScreenshotReadyRef.current) {
      onScreenshotReadyRef.current(() => visualizer.takeScreenshot());
    }

    let lastTickTime = 0;

    // Animation Render Loop (runs at full screen refresh rate)
    const loop = () => {
      // 1. Analyze audio frame
      const audioData = audioEngine.analyze();

      // 2. Throttle React telemetry updates to ~30 FPS to avoid overloading the React render queue
      const now = performance.now();
      if (now - lastTickTime >= 33) {
        lastTickTime = now;
        onTickRef.current(audioData);
      }

      // 3. Render 3D Scene at native display rate
      visualizer.render(audioData);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      visualizer.dispose();
      visualizerRef.current = null;
    };
  }, [audioEngine]);

  // Update visualizer settings when props change
  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.updateSettings(settings);
    }
  }, [settings]);

  return (
    <div
      ref={mountRef}
      style={{ touchAction: 'none' }}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      title="Зажмите и перетаскивайте мышь или касайтесь для свободного 360° вращения"
    />
  );
};
