import { Drum808Params } from '../types/synth';

interface DrumVoiceState {
  type: string;
  phase: number;
  pitch: number;
  pitchDecay: number;
  amp: number;
  ampDecay: number;
  noiseAmp: number;
  noiseDecay: number;
  filter: number;
  filterState: number;
}

export class Drum808Synth {
  private sampleRate: number;
  private voices: DrumVoiceState[] = [];

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  public trigger(instrument: string, velocity: number = 0.8, params: Drum808Params) {
    const vel = velocity;
    switch (instrument) {
      case 'BD': // Bass Drum
        this.voices.push({
          type: 'BD',
          phase: 0,
          pitch: 52 * (0.8 + params.bd_tune * 0.4),
          pitchDecay: 0.9982,
          amp: 1.0 * vel,
          ampDecay: Math.exp(-1.0 / (Math.max(0.08, params.bd_decay * 0.7) * this.sampleRate)),
          noiseAmp: 0.3 * params.bd_attack,
          noiseDecay: 0.95,
          filter: 0.2,
          filterState: 0,
        });
        break;

      case 'SD': // Snare Drum
        this.voices.push({
          type: 'SD',
          phase: 0,
          pitch: 185,
          pitchDecay: 0.9995,
          amp: 0.7 * vel,
          ampDecay: Math.exp(-1.0 / (0.16 * this.sampleRate)),
          noiseAmp: 0.8 * params.sd_snappy * vel,
          noiseDecay: Math.exp(-1.0 / (0.24 * this.sampleRate)),
          filter: 0.45 * params.sd_tone,
          filterState: 0,
        });
        break;

      case 'CH': // Closed Hi-Hat
        this.voices.push({
          type: 'CH',
          phase: 0,
          pitch: 3400,
          pitchDecay: 1.0,
          amp: 0.5 * vel,
          ampDecay: Math.exp(-1.0 / (0.045 * this.sampleRate)),
          noiseAmp: 0.6 * vel,
          noiseDecay: Math.exp(-1.0 / (0.045 * this.sampleRate)),
          filter: 0.75,
          filterState: 0,
        });
        break;

      case 'OH': // Open Hi-Hat
        this.voices.push({
          type: 'OH',
          phase: 0,
          pitch: 3200,
          pitchDecay: 1.0,
          amp: 0.6 * vel,
          ampDecay: Math.exp(-1.0 / (Math.max(0.15, params.hh_decay * 0.6) * this.sampleRate)),
          noiseAmp: 0.7 * vel,
          noiseDecay: Math.exp(-1.0 / (Math.max(0.15, params.hh_decay * 0.6) * this.sampleRate)),
          filter: 0.75,
          filterState: 0,
        });
        break;

      case 'CP': // Hand Clap
        this.voices.push({
          type: 'CP',
          phase: 0,
          pitch: 1000,
          pitchDecay: 1.0,
          amp: 0.7 * vel,
          ampDecay: Math.exp(-1.0 / (Math.max(0.1, params.clap_decay * 0.4) * this.sampleRate)),
          noiseAmp: 0.9 * vel,
          noiseDecay: Math.exp(-1.0 / (Math.max(0.12, params.clap_decay * 0.45) * this.sampleRate)),
          filter: 0.6,
          filterState: 0,
        });
        break;

      case 'LT': // Low Tom
      case 'MT': // Mid Tom
      case 'HT': // High Tom
        {
          const baseP = instrument === 'LT' ? 90 : instrument === 'MT' ? 130 : 175;
          this.voices.push({
            type: 'TOM',
            phase: 0,
            pitch: baseP * (0.8 + params.tom_tune * 0.4),
            pitchDecay: 0.9988,
            amp: 0.75 * vel,
            ampDecay: Math.exp(-1.0 / (0.35 * this.sampleRate)),
            noiseAmp: 0.1 * vel,
            noiseDecay: 0.98,
            filter: 0.25,
            filterState: 0,
          });
        }
        break;

      case 'CB': // Cowbell
        this.voices.push({
          type: 'CB',
          phase: 0,
          pitch: 587,
          pitchDecay: 1.0,
          amp: 0.6 * vel,
          ampDecay: Math.exp(-1.0 / (0.28 * this.sampleRate)),
          noiseAmp: 0,
          noiseDecay: 0,
          filter: 0.8,
          filterState: 0,
        });
        break;
    }
  }

  public processSample(params: Drum808Params): number {
    if (this.voices.length === 0) return 0;

    let mix = 0;
    for (let i = this.voices.length - 1; i >= 0; i--) {
      const v = this.voices[i];
      if (v.amp < 0.001 && v.noiseAmp < 0.001) {
        this.voices.splice(i, 1);
        continue;
      }

      let voiceOut = 0;
      const noise = (Math.random() * 2.0 - 1.0);

      if (v.type === 'BD') {
        v.pitch *= v.pitchDecay;
        v.phase += Math.min(0.4, v.pitch / this.sampleRate);
        if (v.phase >= 1.0) v.phase -= 1.0;
        const body = Math.sin(v.phase * Math.PI * 2.0);
        voiceOut = (body * v.amp) + (noise * v.noiseAmp);
        v.amp *= v.ampDecay;
        v.noiseAmp *= v.noiseDecay;
      } else if (v.type === 'SD') {
        v.phase += Math.min(0.4, v.pitch / this.sampleRate);
        if (v.phase >= 1.0) v.phase -= 1.0;
        const body = Math.sin(v.phase * Math.PI * 2.0) * 0.5 + Math.sin(v.phase * Math.PI * 4.0) * 0.3;
        v.filterState += v.filter * (noise - v.filterState);
        voiceOut = (body * v.amp) + (v.filterState * v.noiseAmp);
        v.amp *= v.ampDecay;
        v.noiseAmp *= v.noiseDecay;
      } else if (v.type === 'CH' || v.type === 'OH') {
        // Metallic pulse ring
        v.phase += 0.23;
        if (v.phase >= 1.0) v.phase -= 1.0;
        const metal = (v.phase < 0.5 ? 1 : -1) * 0.3 + (Math.sin(v.phase * 12.3) > 0 ? 0.3 : -0.3);
        const filtered = noise * 0.7 + metal * 0.5;
        v.filterState += v.filter * (filtered - v.filterState);
        voiceOut = (filtered - v.filterState) * v.amp;
        v.amp *= v.ampDecay;
      } else if (v.type === 'CP') {
        v.filterState += v.filter * (noise - v.filterState);
        voiceOut = v.filterState * v.noiseAmp;
        v.noiseAmp *= v.noiseDecay;
      } else if (v.type === 'TOM') {
        v.pitch *= v.pitchDecay;
        v.phase += Math.min(0.4, v.pitch / this.sampleRate);
        if (v.phase >= 1.0) v.phase -= 1.0;
        voiceOut = Math.sin(v.phase * Math.PI * 2.0) * v.amp;
        v.amp *= v.ampDecay;
      } else if (v.type === 'CB') {
        // Two metallic square frequencies: 587 Hz & 845 Hz
        v.phase += Math.min(0.4, v.pitch / this.sampleRate);
        if (v.phase >= 1.0) v.phase -= 1.0;
        const p2 = (v.phase * 1.44) % 1.0;
        const cb = (v.phase < 0.5 ? 1 : -1) * 0.6 + (p2 < 0.5 ? 1 : -1) * 0.4;
        voiceOut = cb * v.amp;
        v.amp *= v.ampDecay;
      }

      mix += voiceOut;
    }

    return mix * params.volume * 0.85;
  }
}
