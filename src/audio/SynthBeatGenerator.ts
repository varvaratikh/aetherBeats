import { SynthPreset } from '../types/visualizer';

/**
 * Procedural Web Audio Beat & Soundscape Synthesizer
 * Generates futuristic rhythmic beats, cyber synth arpeggios, and ambient vocal tones.
 */
export class SynthBeatGenerator {
  private ctx: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private preset: SynthPreset = 'cyber-beat';
  private bpm: number = 126;

  constructor() {}

  public init(audioCtx: AudioContext, destination: AudioNode): void {
    this.ctx = audioCtx;
    this.outputNode = this.ctx.createGain();
    this.outputNode.gain.value = 0.85;
    this.outputNode.connect(destination);
  }

  public setPreset(preset: SynthPreset): void {
    this.preset = preset;
    if (preset === 'cyber-beat') this.bpm = 126;
    else if (preset === 'ambient-space') this.bpm = 80;
    else if (preset === 'vocal-synth') this.bpm = 98;
  }

  public start(): void {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.currentStep = 0;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const intervalMs = (60 / this.bpm / 4) * 1000; // 16th notes
    this.timerId = window.setInterval(() => {
      this.onTick();
    }, intervalMs);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getPreset(): SynthPreset {
    return this.preset;
  }

  private onTick(): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;
    const step16 = this.currentStep % 16;
    const step32 = this.currentStep % 32;

    if (this.preset === 'cyber-beat') {
      // 4-on-the-floor Kick on 0, 4, 8, 12
      if (step16 % 4 === 0) {
        this.triggerKick(now);
      }
      // Snare / Clap on step 4 and 12
      if (step16 === 4 || step16 === 12) {
        this.triggerSnare(now);
      }
      // Hi-hats on off-beats + subtle roll on 14, 15
      if (step16 % 2 === 1 || step16 === 14 || step16 === 15) {
        this.triggerHiHat(now, step16 === 14 ? 0.3 : 0.6);
      }
      // Cyber Bass & Arpeggio Synths
      if (step16 % 2 === 0) {
        const notes = [48, 48, 51, 55, 58, 60, 58, 55]; // C Minor Pentatonic
        const note = notes[step16 / 2 % notes.length];
        this.triggerSynthLead(now, note);
      }
      // Sub-bass glide on step 0 and 8
      if (step16 === 0 || step16 === 8) {
        this.triggerSubBass(now, 36);
      }
    } else if (this.preset === 'ambient-space') {
      // Hypnotic space drone with slow pulsing chords & crystalline highs
      if (step32 === 0) {
        this.triggerSpaceDrone(now, 36); // Deep C
        this.triggerSpaceDrone(now + 0.1, 43); // G
        this.triggerSpaceDrone(now + 0.2, 51); // Eb
      }
      if (step32 % 8 === 0) {
        this.triggerKick(now, 0.4);
      }
      if (step16 % 4 === 2) {
        const bells = [67, 72, 75, 79, 84];
        const bellNote = bells[Math.floor(Math.random() * bells.length)];
        this.triggerCrystalChime(now, bellNote);
      }
    } else if (this.preset === 'vocal-synth') {
      // Vocal formant simulator (simulating voice speech vowels 'A - O - E - U')
      if (step16 % 4 === 0) {
        const formants = [
          { f1: 730, f2: 1090 }, // 'Ah'
          { f1: 520, f2: 850 },  // 'Oh'
          { f1: 270, f2: 2290 }, // 'Ee'
          { f1: 300, f2: 870 },  // 'Oo'
        ];
        const form = formants[(step16 / 4) % formants.length];
        this.triggerVocalFormant(now, 130 + (step16 === 12 ? 30 : 0), form.f1, form.f2);
      }
      if (step16 % 4 === 0) {
        this.triggerKick(now, 0.7);
      }
      if (step16 === 8) {
        this.triggerSnare(now, 0.5);
      }
      if (step16 % 2 === 1) {
        this.triggerHiHat(now, 0.4);
      }
    }

    this.currentStep++;
  }

  private triggerKick(time: number, gainMul = 1.0): void {
    if (!this.ctx || !this.outputNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(1.0 * gainMul, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  private triggerSubBass(time: number, midiNote: number): void {
    if (!this.ctx || !this.outputNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    osc.connect(gain);
    gain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.62);
  }

  private triggerSnare(time: number, gainMul = 1.0): void {
    if (!this.ctx || !this.outputNode) return;

    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7 * gainMul, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noise.start(time);
    noise.stop(time + 0.16);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.08);

    oscGain.gain.setValueAtTime(0.5 * gainMul, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private triggerHiHat(time: number, vol = 0.5): void {
    if (!this.ctx || !this.outputNode) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    noise.start(time);
    noise.stop(time + 0.045);
  }

  private triggerSynthLead(time: number, midiNote: number): void {
    if (!this.ctx || !this.outputNode) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.004, time); // detuned

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, time + 0.2);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.23);
    osc2.stop(time + 0.23);
  }

  private triggerSpaceDrone(time: number, midiNote: number): void {
    if (!this.ctx || !this.outputNode) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.linearRampToValueAtTime(800, time + 1.5);
    filter.frequency.linearRampToValueAtTime(300, time + 3.0);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.45, time + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 3.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 3.1);
  }

  private triggerCrystalChime(time: number, midiNote: number): void {
    if (!this.ctx || !this.outputNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

    osc.connect(gain);
    gain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 1.25);
  }

  private triggerVocalFormant(time: number, fundamentalFreq: number, f1: number, f2: number): void {
    if (!this.ctx || !this.outputNode) return;

    // Glottal pulse oscillator (sawtooth/pulse)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fundamentalFreq, time);

    // Formant 1 filter
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(f1, time);
    filter1.Q.value = 6;

    // Formant 2 filter
    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(f2, time);
    filter2.Q.value = 8;

    const gain1 = this.ctx.createGain();
    gain1.gain.value = 0.6;
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.4;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, time);
    masterGain.gain.linearRampToValueAtTime(0.6, time + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc.connect(filter1);
    osc.connect(filter2);
    filter1.connect(gain1);
    filter2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    masterGain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + 0.5);
  }
}
