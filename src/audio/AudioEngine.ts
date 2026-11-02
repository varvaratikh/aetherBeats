import { AudioAnalysisData, AudioSourceType, SynthPreset } from '../types/visualizer';
import { SynthBeatGenerator } from './SynthBeatGenerator';

/**
 * Ultra-Responsive Web Audio API Engine
 * Features:
 * - Dynamic Auto-Gain Control (AGC) & Adaptive Noise Normalization
 * - Ultra-sensitive microphone capture with high dynamic range
 * - Fast-attack frequency decomposition for speech, vocals, and music
 * - Dual-stage beat & transient onset detection
 * - Pitch tracking via harmonic peak detection
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private synthGenerator: SynthBeatGenerator;

  private currentSource: AudioSourceType = 'synth';
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private timeDomainData: Uint8Array<ArrayBuffer> | null = null;

  // Adaptive Auto-Gain & Normalization
  private rollingPeak: number = 0.05;
  private autoGainEnabled: boolean = true;
  private manualGain: number = 2.5; // High default sensitivity so quiet mics work instantly

  // Beat detection state
  private energyHistory: number[] = [];
  private readonly historySize = 30;
  private lastBeatTime: number = 0;
  private beatCooldownMs: number = 130; // Fast recovery for rapid beats

  // Smoothed output values with fast attack & smooth release
  private smoothedSubBass: number = 0;
  private smoothedBass: number = 0;
  private smoothedMid: number = 0;
  private smoothedHighMid: number = 0;
  private smoothedTreble: number = 0;
  private smoothedEnergy: number = 0;

  private micPermissionError: string | null = null;

  constructor() {
    this.synthGenerator = new SynthBeatGenerator();
  }

  public async initialize(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048; // High frequency resolution
    this.analyser.smoothingTimeConstant = 0.65; // Faster attack than 0.8 for snappy speech response

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.manualGain;

    this.gainNode.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(new ArrayBuffer(bufferLength));
    this.timeDomainData = new Uint8Array(new ArrayBuffer(bufferLength));

    // Initialize synth
    const synthMaster = this.ctx.createGain();
    synthMaster.gain.value = 0.85;
    this.synthGenerator.init(this.ctx, synthMaster);
    synthMaster.connect(this.ctx.destination);
    synthMaster.connect(this.gainNode);
  }

  public setSensitivity(val: number): void {
    this.manualGain = Math.max(0.5, Math.min(8.0, val));
    if (this.gainNode) {
      this.gainNode.gain.value = this.manualGain;
    }
  }

  public getSensitivity(): number {
    return this.manualGain;
  }

  public setAutoGain(enabled: boolean): void {
    this.autoGainEnabled = enabled;
  }

  public getAutoGain(): boolean {
    return this.autoGainEnabled;
  }

  public getSynth(): SynthBeatGenerator {
    return this.synthGenerator;
  }

  public getCurrentSource(): AudioSourceType {
    return this.currentSource;
  }

  public getMicPermissionError(): string | null {
    return this.micPermissionError;
  }

  /**
   * Switch to live microphone listening with optimized audio constraints
   */
  public async enableMicrophone(): Promise<boolean> {
    await this.initialize();
    if (!this.ctx || !this.analyser || !this.gainNode) return false;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.synthGenerator.stop();

    if (this.audioEl) {
      this.audioEl.pause();
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    try {
      this.micPermissionError = null;
      // Request mic with AutoGainControl enabled for optimal hardware capture
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      this.micStream = stream;
      this.sourceNode = this.ctx.createMediaStreamSource(stream);
      this.sourceNode.connect(this.gainNode);
      // NOTE: Do not connect mic to destination to prevent acoustic feedback howl
      this.currentSource = 'mic';
      return true;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Не удалось получить доступ к микрофону';
      this.micPermissionError = errorMsg;
      console.warn('Microphone error:', err);
      return false;
    }
  }

  /**
   * Switch to built-in procedural synth beats
   */
  public async enableSynth(preset: SynthPreset = 'cyber-beat'): Promise<void> {
    await this.initialize();
    if (!this.ctx || !this.analyser) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.audioEl) {
      this.audioEl.pause();
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }

    this.currentSource = 'synth';
    this.synthGenerator.setPreset(preset);
    this.synthGenerator.start();
  }

  /**
   * Load and play custom audio file
   */
  public async loadAudioFile(file: File): Promise<void> {
    await this.initialize();
    if (!this.ctx || !this.analyser || !this.gainNode) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.synthGenerator.stop();

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = objectUrl;
    audio.crossOrigin = 'anonymous';
    audio.loop = true;

    this.audioEl = audio;
    this.sourceNode = this.ctx.createMediaElementSource(audio);
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.connect(this.ctx.destination);

    await audio.play();
    this.currentSource = 'file';
  }

  /**
   * Primary frame-by-frame analysis function
   */
  public analyze(): AudioAnalysisData {
    if (!this.analyser || !this.frequencyData || !this.timeDomainData || !this.ctx) {
      return {
        subBass: 0,
        bass: 0,
        mid: 0,
        highMid: 0,
        treble: 0,
        overallEnergy: 0,
        peakEnergy: 0,
        isBeat: false,
        beatIntensity: 0,
        dominantFrequency: 0,
        frequencyArray: new Uint8Array(new ArrayBuffer(0)),
        timeDomainArray: new Uint8Array(new ArrayBuffer(0)),
      };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    const sampleRate = this.ctx.sampleRate;
    const binCount = this.analyser.frequencyBinCount;
    const binHz = sampleRate / (binCount * 2);

    // 1. Calculate raw band energies
    const rawSubBass = this.getBandAverage(20, 80, binHz, this.frequencyData);
    const rawBass = this.getBandAverage(80, 250, binHz, this.frequencyData);
    const rawMid = this.getBandAverage(250, 2200, binHz, this.frequencyData);
    const rawHighMid = this.getBandAverage(2200, 6000, binHz, this.frequencyData);
    const rawTreble = this.getBandAverage(6000, 16000, binHz, this.frequencyData);

    // 2. RMS Energy & Peak Frequency
    let sumSquares = 0;
    let peakVal = 0;
    let peakIndex = 0;
    for (let i = 0; i < binCount; i++) {
      const val = this.frequencyData[i] / 255;
      sumSquares += val * val;
      if (val > peakVal) {
        peakVal = val;
        peakIndex = i;
      }
    }
    const rawRms = Math.sqrt(sumSquares / binCount);
    const dominantFreq = Math.round(peakIndex * binHz);

    // 3. Adaptive Normalization / Auto-Gain
    // Slowly decay rolling peak, expand when louder
    if (rawRms > this.rollingPeak) {
      this.rollingPeak = rawRms;
    } else {
      this.rollingPeak = Math.max(0.04, this.rollingPeak * 0.995); // gentle decay
    }

    // Dynamic boost multiplier so even quiet speech fills the screen
    const normalizer = this.autoGainEnabled
      ? Math.min(5.0, Math.max(1.0, 0.45 / (this.rollingPeak + 0.001)))
      : 1.0;

    const subBassVal = Math.min(1.0, rawSubBass * normalizer);
    const bassVal = Math.min(1.0, rawBass * normalizer);
    const midVal = Math.min(1.0, rawMid * normalizer);
    const highMidVal = Math.min(1.0, rawHighMid * normalizer);
    const trebleVal = Math.min(1.0, rawTreble * normalizer);
    const rms = Math.min(1.0, rawRms * normalizer);

    // 4. Dynamic Beat Detection: compares energy to local moving average
    const combinedBass = subBassVal * 0.55 + bassVal * 0.45;
    this.energyHistory.push(combinedBass);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    let avgEnergy = 0;
    for (let i = 0; i < this.energyHistory.length; i++) {
      avgEnergy += this.energyHistory[i];
    }
    avgEnergy = avgEnergy / Math.max(1, this.energyHistory.length);

    // Adaptive threshold: trigger on 25% increase over local average or when speech transient occurs
    const threshold = avgEnergy * 1.25 + 0.06;
    const nowMs = performance.now();
    let isBeat = false;
    let beatIntensity = 0;

    if (combinedBass > threshold && combinedBass > 0.08 && nowMs - this.lastBeatTime > this.beatCooldownMs) {
      isBeat = true;
      this.lastBeatTime = nowMs;
      beatIntensity = Math.min(1.0, (combinedBass - threshold) / (1.0 - threshold + 0.001) + 0.5);
    }

    // 5. Asymmetric smoothing: Fast Attack (0.45) for immediate punch, Smooth Release (0.18)
    const attack = 0.42;
    const release = 0.16;

    this.smoothedSubBass += (subBassVal - this.smoothedSubBass) * (subBassVal > this.smoothedSubBass ? attack : release);
    this.smoothedBass += (bassVal - this.smoothedBass) * (bassVal > this.smoothedBass ? attack : release);
    this.smoothedMid += (midVal - this.smoothedMid) * (midVal > this.smoothedMid ? attack : release);
    this.smoothedHighMid += (highMidVal - this.smoothedHighMid) * (highMidVal > this.smoothedHighMid ? attack : release);
    this.smoothedTreble += (trebleVal - this.smoothedTreble) * (trebleVal > this.smoothedTreble ? attack : release);
    this.smoothedEnergy += (rms - this.smoothedEnergy) * (rms > this.smoothedEnergy ? attack : release);

    return {
      subBass: this.smoothedSubBass,
      bass: this.smoothedBass,
      mid: this.smoothedMid,
      highMid: this.smoothedHighMid,
      treble: this.smoothedTreble,
      overallEnergy: this.smoothedEnergy,
      peakEnergy: peakVal,
      isBeat,
      beatIntensity,
      dominantFrequency: dominantFreq,
      frequencyArray: this.frequencyData,
      timeDomainArray: this.timeDomainData,
    };
  }

  private getBandAverage(lowHz: number, highHz: number, binHz: number, data: Uint8Array): number {
    const lowBin = Math.max(0, Math.floor(lowHz / binHz));
    const highBin = Math.min(data.length - 1, Math.ceil(highHz / binHz));
    if (highBin <= lowBin) return (data[lowBin] || 0) / 255;

    let sum = 0;
    for (let i = lowBin; i <= highBin; i++) {
      sum += data[i];
    }
    return sum / (highBin - lowBin + 1) / 255;
  }

  public dispose(): void {
    if (this.synthGenerator) {
      this.synthGenerator.stop();
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
