import { Bass303Params } from '../types/synth';

export class Bass303Voice {
  private sampleRate: number;
  private phase: number = 0;
  private baseFreq: number = 110;
  private targetFreq: number = 110;
  private noteActive: boolean = false;
  private currentNote: number = -1;
  private velocity: number = 0.8;
  private accentActive: boolean = false;

  private env: number = 0;
  private accentEnv: number = 0;
  private c0: number = 0;
  private c1: number = 0;
  private c2: number = 0;
  private c3: number = 0;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  public noteOn(note: number, velocity: number = 0.8, params: Bass303Params, slide: boolean = false, accent: boolean = false) {
    this.currentNote = note;
    this.velocity = velocity;
    this.noteActive = true;
    this.accentActive = accent;
    this.targetFreq = 440.0 * Math.pow(2.0, (note - 69.0) / 12.0);

    if (!slide || this.env < 0.05) {
      this.baseFreq = this.targetFreq;
      this.env = 1.0;
      if (accent) this.accentEnv = 1.0;
    }
  }

  public noteOff() {
    this.noteActive = false;
  }

  public isFree(): boolean {
    return !this.noteActive && this.env < 0.001;
  }

  public getNote(): number {
    return this.currentNote;
  }

  public processSample(params: Bass303Params): number {
    if (this.env < 0.0001 && !this.noteActive) return 0;

    // Slide pitch tracking
    if (params.slide > 0.01) {
      const slideCoeff = 1.0 / (params.slide * this.sampleRate * 0.15 + 1);
      this.baseFreq += (this.targetFreq - this.baseFreq) * slideCoeff;
    } else {
      this.baseFreq = this.targetFreq;
    }

    // Phase increment
    const phaseInc = Math.min(0.48, this.baseFreq / this.sampleRate);
    this.phase += phaseInc;
    if (this.phase >= 1.0) this.phase -= 1.0;

    // Oscillator Waveform (0=Sawtooth, 1=Square)
    let wave = 0;
    if (params.waveform === 0) {
      wave = 2.0 * this.phase - 1.0;
    } else {
      wave = this.phase < 0.5 ? 1.0 : -1.0;
    }

    // Envelope decay
    const decayFactor = Math.exp(-1.0 / (Math.max(0.04, params.decay * (this.accentActive ? 0.35 : 1.0)) * this.sampleRate));
    this.env *= decayFactor;
    if (this.accentEnv > 0.0001) {
      this.accentEnv *= 0.9992;
    }

    // Cutoff modulation
    const envMod = this.env * params.envMod * 0.75 + (this.accentActive ? this.accentEnv * params.accent * 0.4 : 0);
    const modCutoff = Math.min(0.96, Math.max(0.02, params.cutoff * 0.85 + envMod));
    const reso = Math.min(0.95, params.resonance * 0.94);

    // Diode Ladder 303 filter approximation
    const f = modCutoff * 1.16;
    const fb = reso * (1.0 - 0.15 * f * f);
    wave -= this.c3 * fb * 3.6;

    this.c0 += f * (wave - this.c0);
    this.c1 += f * (this.c0 - this.c1);
    this.c2 += f * (this.c1 - this.c2);
    this.c3 += f * (this.c2 - this.c3);

    let out = this.c3 * this.env;

    // Distortion / Drive
    if (params.driveType > 0 && params.drive > 0.01) {
      const gain = 1.0 + params.drive * (params.driveType === 2 ? 18.0 : 6.0);
      out = Math.tanh(out * gain) * (1.0 / Math.sqrt(gain));
    }

    return out * params.volume * (this.accentActive ? 1.25 : 0.9);
  }
}
