import { DX7Params } from '../types/synth';

export class DX7Voice {
  private sampleRate: number;
  private baseFreq: number = 440;
  private noteActive: boolean = false;
  private currentNote: number = -1;
  private velocity: number = 0.8;

  // 6 operator phases, envelopes, feedback buffer
  private opPhases: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
  private opEnvs: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
  private fbHistory: [number, number] = [0, 0];

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  public noteOn(note: number, velocity: number = 0.8) {
    this.currentNote = note;
    this.velocity = velocity;
    this.noteActive = true;
    this.baseFreq = 440.0 * Math.pow(2.0, (note - 69.0) / 12.0);
    this.opEnvs.fill(0);
    this.fbHistory = [0, 0];
  }

  public noteOff() {
    this.noteActive = false;
  }

  public isFree(): boolean {
    return !this.noteActive && this.opEnvs[0] < 0.001;
  }

  public getNote(): number {
    return this.currentNote;
  }

  public processSample(params: DX7Params): number {
    if (!this.noteActive && this.opEnvs[0] < 0.0001) return 0;

    // Advance operator envelopes (simple attack / decay)
    for (let i = 0; i < 6; i++) {
      const op = params.ops[i];
      const attackRate = 1.0 / (Math.max(0.002, op.attack) * this.sampleRate);
      const decayRate = 1.0 / (Math.max(0.01, op.decay) * this.sampleRate);

      if (this.noteActive) {
        if (this.opEnvs[i] < op.level) {
          this.opEnvs[i] += attackRate;
          if (this.opEnvs[i] > op.level) this.opEnvs[i] = op.level;
        }
      } else {
        this.opEnvs[i] -= decayRate;
        if (this.opEnvs[i] < 0) this.opEnvs[i] = 0;
      }
    }

    // Phase increments
    const outputs: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6; i++) {
      const op = params.ops[i];
      const freq = this.baseFreq * op.ratio * Math.pow(2.0, op.detune / 1200.0);
      this.opPhases[i] += Math.min(0.48, freq / this.sampleRate);
      if (this.opPhases[i] >= 1.0) this.opPhases[i] -= 1.0;
    }

    // Feedback on Op 6
    const fb = (this.fbHistory[0] + this.fbHistory[1]) * 0.5 * params.feedback;
    const op6Phase = (this.opPhases[5] + fb) % 1.0;
    outputs[5] = Math.sin(op6Phase * Math.PI * 2.0) * this.opEnvs[5];
    this.fbHistory[1] = this.fbHistory[0];
    this.fbHistory[0] = outputs[5];

    // Compute standard FM algorithm (e.g. Algorithm 1 or 5: carrier + modulators)
    // 6 modulates 5, 5 modulates 4, etc. or parallel branches
    if (params.algorithm <= 4) {
      // Serial chain: 6 -> 5 -> 4 -> 3 -> 2 -> 1
      outputs[4] = Math.sin((this.opPhases[4] + outputs[5] * 0.5) * Math.PI * 2.0) * this.opEnvs[4];
      outputs[3] = Math.sin((this.opPhases[3] + outputs[4] * 0.5) * Math.PI * 2.0) * this.opEnvs[3];
      outputs[2] = Math.sin((this.opPhases[2] + outputs[3] * 0.5) * Math.PI * 2.0) * this.opEnvs[2];
      outputs[1] = Math.sin((this.opPhases[1] + outputs[2] * 0.5) * Math.PI * 2.0) * this.opEnvs[1];
      outputs[0] = Math.sin((this.opPhases[0] + outputs[1] * 0.5) * Math.PI * 2.0) * this.opEnvs[0];
      return outputs[0] * this.velocity * params.volume;
    } else {
      // 2-branch parallel: (6->5->4) + (3->2->1)
      outputs[4] = Math.sin((this.opPhases[4] + outputs[5] * 0.5) * Math.PI * 2.0) * this.opEnvs[4];
      outputs[3] = Math.sin((this.opPhases[3] + outputs[4] * 0.5) * Math.PI * 2.0) * this.opEnvs[3];
      outputs[1] = Math.sin((this.opPhases[1] + outputs[2] * 0.5) * Math.PI * 2.0) * this.opEnvs[1];
      outputs[0] = Math.sin((this.opPhases[0] + outputs[1] * 0.5) * Math.PI * 2.0) * this.opEnvs[0];
      return (outputs[3] + outputs[0]) * 0.5 * this.velocity * params.volume;
    }
  }
}
