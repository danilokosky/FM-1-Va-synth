// FM-1 Virtual Analog Moog & Multi-Engine Types

export type EngineType = 'moog' | 'bass303' | 'drum808' | 'dx7' | 'psg';

export interface MoogOscillator {
  waveform: number; // 0 = Sawtooth, 1 = Pulse/Square, 2 = Triangle, 3 = Sine
  volume: number; // 0.0 to 1.0
  semi_offset: number; // -24 to +24 semitones
  detune_cents: number; // -50 to +50 cents
  pulse_width: number; // 0.05 to 0.95
}

export interface MoogParams {
  master_volume: number;
  cutoff: number; // 0.0 to 1.0
  resonance: number; // 0.0 to 1.0
  envMod: number; // 0.0 to 1.0
  glide: number; // 0.0 to 1.0
  filter_attack: number;
  filter_decay: number;
  filter_sustain: number;
  filter_release: number;
  amp_attack: number;
  amp_decay: number;
  amp_sustain: number;
  amp_release: number;
  osc: [MoogOscillator, MoogOscillator, MoogOscillator];
}

export interface Bass303Params {
  cutoff: number;
  resonance: number;
  envMod: number;
  decay: number;
  accent: number;
  waveform: number; // 0 = Saw, 1 = Square
  tune: number;
  volume: number;
  drive: number;
  driveType: number; // 0 = Off, 1 = Soft, 2 = RAT
  slide: number;
  accentDecay: number;
}

export interface Drum808Params {
  bd_decay: number;
  bd_tune: number;
  bd_attack: number;
  sd_tone: number;
  sd_snappy: number;
  hh_decay: number;
  clap_decay: number;
  tom_tune: number;
  volume: number;
}

export interface DX7Operator {
  ratio: number;
  detune: number;
  level: number;
  attack: number;
  decay: number;
}

export interface DX7Params {
  algorithm: number; // 1 to 32
  feedback: number;
  volume: number;
  ops: [DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator];
}

export interface StepData {
  active: boolean;
  note: number; // MIDI Note 0-127
  velocity: number; // 1-127
  gate: number; // 0.1 - 1.0 (fraction of step)
  slide?: boolean;
  accent?: boolean;
}

export interface TrackData {
  id: number;
  name: string;
  engine: EngineType;
  role: 'NORMAL' | 'PLAY' | 'OFF';
  midiChannel: number;
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 to 1.0
  mute: boolean;
  solo: boolean;
  delaySend: number; // 0.0 to 1.0
  reverbSend: number; // 0.0 to 1.0
  steps: StepData[];
  moogParams?: MoogParams;
  bass303Params?: Bass303Params;
  drum808Params?: Drum808Params;
  dx7Params?: DX7Params;
}

export interface ProjectData {
  name: string;
  bpm: number;
  swing: number; // 0 to 75%
  stepCount: number; // 16, 32, 64
  tracks: TrackData[];
  masterVolume: number;
  delayTime: number; // ms or beat fraction
  delayFeedback: number;
  delayMix: number;
  reverbDecay: number;
  reverbMix: number;
}
