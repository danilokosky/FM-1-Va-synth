import { MoogParams } from '../types/synth';

// Fast approximation of tanh for audio DSP loop performance
function fastTanh(x: number): number {
  if (x < -3) return -1;
  if (x > 3) return 1;
  const x2 = x * x;
  return (x * (27 + x2)) / (27 + 9 * x2);
}

export class MoogVoice {
  private sampleRate: number;
  private baseFreq: number = 440;
  private targetFreq: number = 440;
  private noteActive: boolean = false;
  private currentNote: number = -1;
  private velocity: number = 0.8;

  // Envelopes
  private ampEnv: number = 0;
  private filterEnv: number = 0;

  // Oscillator phases & increments
  private phase: [number, number, number] = [0, 0, 0];
  private phaseIncrement: [number, number, number] = [0, 0, 0];

  // 4-stage Moog Ladder Filter state
  private stage: [number, number, number, number] = [0, 0, 0, 0];

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  public noteOn(note: number, velocity: number = 0.8, params: MoogParams, legato: boolean = false) {
    this.currentNote = note;
    this.velocity = velocity;
    this.noteActive = true;
    this.targetFreq = 440.0 * Math.pow(2.0, (note - 69.0) / 12.0);

    if (!legato || this.ampEnv < 0.05) {
      this.baseFreq = this.targetFreq;
      this.ampEnv = 0.0;
      this.filterEnv = 0.0;
    }

    this.updateFrequencies(params);
  }

  public noteOff() {
    this.noteActive = false;
  }

  public isFree(): boolean {
    return !this.noteActive && this.ampEnv < 0.001;
  }

  public getNote(): number {
    return this.currentNote;
  }

  public updateFrequencies(params: MoogParams) {
    for (let i = 0; i < 3; i++) {
      const osc = params.osc[i];
      const totalShift = osc.semi_offset + (osc.detune_cents / 100.0);
      const oscFreq = this.baseFreq * Math.pow(2.0, totalShift / 12.0);
      this.phaseIncrement[i] = Math.min(0.48, oscFreq / this.sampleRate);
    }
  }

  public processSample(params: MoogParams): number {
    if (!this.noteActive && this.ampEnv < 0.0001) {
      return 0.0;
    }

    // Portamento / Glide
    if (params.glide > 0.001) {
      const glideSpeed = 1.0 / (params.glide * this.sampleRate * 0.5 + 1);
      this.baseFreq += (this.targetFreq - this.baseFreq) * glideSpeed;
      this.updateFrequencies(params);
    } else {
      this.baseFreq = this.targetFreq;
    }

    // 1. Amplitude Envelope (ADSR)
    const ampAttackRate = 1.0 / (Math.max(0.001, params.amp_attack) * this.sampleRate);
    const ampDecayRate = 1.0 / (Math.max(0.005, params.amp_decay) * this.sampleRate);
    const ampReleaseRate = 1.0 / (Math.max(0.005, params.amp_release) * this.sampleRate);

    if (this.noteActive) {
      if (this.ampEnv < 1.0) {
        this.ampEnv += ampAttackRate;
        if (this.ampEnv > 1.0) this.ampEnv = 1.0;
      } else {
        const targetSustain = params.amp_sustain;
        if (this.ampEnv > targetSustain) {
          this.ampEnv -= ampDecayRate;
          if (this.ampEnv < targetSustain) this.ampEnv = targetSustain;
        } else {
          this.ampEnv += ampAttackRate;
          if (this.ampEnv > targetSustain) this.ampEnv = targetSustain;
        }
      }
    } else {
      this.ampEnv -= ampReleaseRate;
      if (this.ampEnv < 0.0) this.ampEnv = 0.0;
    }

    // 2. Filter Envelope (ADSR)
    const fAttackRate = 1.0 / (Math.max(0.001, params.filter_attack) * this.sampleRate);
    const fDecayRate = 1.0 / (Math.max(0.005, params.filter_decay) * this.sampleRate);
    const fReleaseRate = 1.0 / (Math.max(0.005, params.filter_release) * this.sampleRate);

    if (this.noteActive) {
      if (this.filterEnv < 1.0) {
        this.filterEnv += fAttackRate;
        if (this.filterEnv > 1.0) this.filterEnv = 1.0;
      } else {
        const targetSustain = params.filter_sustain;
        if (this.filterEnv > targetSustain) {
          this.filterEnv -= fDecayRate;
          if (this.filterEnv < targetSustain) this.filterEnv = targetSustain;
        }
      }
    } else {
      this.filterEnv -= fReleaseRate;
      if (this.filterEnv < 0.0) this.filterEnv = 0.0;
    }

    // 3. Mix 3 Oscillators (exact logic from moog_engine.c)
    let mixed = 0.0;
    for (let i = 0; i < 3; i++) {
      this.phase[i] += this.phaseIncrement[i];
      if (this.phase[i] >= 1.0) this.phase[i] -= 1.0;

      const osc = params.osc[i];
      let wave = 0.0;
      if (osc.waveform === 0) {
        // Sawtooth
        wave = (2.0 * this.phase[i]) - 1.0;
      } else if (osc.waveform === 1) {
        // Pulse / Square
        wave = (this.phase[i] < osc.pulse_width) ? 1.0 : -1.0;
      } else if (osc.waveform === 2) {
        // Triangle
        wave = (4.0 * Math.abs(this.phase[i] - 0.5)) - 1.0;
      } else {
        // Sine
        wave = Math.sin(2.0 * Math.PI * this.phase[i]);
      }
      mixed += wave * osc.volume;
    }
    mixed *= 0.33;

    // 4. Moog Ladder Filter (4 Poles) with tanh non-linear saturation
    const dynamicCutoff = Math.min(0.98, Math.max(0.01, params.cutoff + this.filterEnv * params.envMod * 0.7));
    const f = dynamicCutoff * 0.95;
    const k = params.resonance * 3.8;

    const input = mixed - k * this.stage[3];
    this.stage[0] += f * (fastTanh(input) - fastTanh(this.stage[0]));
    this.stage[1] += f * (fastTanh(this.stage[0]) - fastTanh(this.stage[1]));
    this.stage[2] += f * (fastTanh(this.stage[1]) - fastTanh(this.stage[2]));
    this.stage[3] += f * (fastTanh(this.stage[2]) - fastTanh(this.stage[3]));

    // Master output with amp envelope & velocity
    return this.stage[3] * this.ampEnv * this.velocity * params.master_volume;
  }
}
