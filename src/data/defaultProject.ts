import { ProjectData, TrackData, MoogParams, Bass303Params, Drum808Params, DX7Params } from '../types/synth';

export const defaultMoogParams: MoogParams = {
  master_volume: 0.85,
  cutoff: 0.55,
  resonance: 0.42,
  envMod: 0.48,
  glide: 0.08,
  filter_attack: 0.02,
  filter_decay: 0.28,
  filter_sustain: 0.35,
  filter_release: 0.3,
  amp_attack: 0.01,
  amp_decay: 0.4,
  amp_sustain: 0.7,
  amp_release: 0.35,
  osc: [
    { waveform: 0, volume: 0.85, semi_offset: 0, detune_cents: -5.0, pulse_width: 0.5 },
    { waveform: 0, volume: 0.8, semi_offset: 0, detune_cents: 5.0, pulse_width: 0.5 },
    { waveform: 1, volume: 0.65, semi_offset: -12, detune_cents: 0.0, pulse_width: 0.5 },
  ],
};

export const defaultMoogBassParams: MoogParams = {
  master_volume: 0.9,
  cutoff: 0.38,
  resonance: 0.5,
  envMod: 0.65,
  glide: 0.04,
  filter_attack: 0.005,
  filter_decay: 0.22,
  filter_sustain: 0.15,
  filter_release: 0.18,
  amp_attack: 0.005,
  amp_decay: 0.3,
  amp_sustain: 0.4,
  amp_release: 0.2,
  osc: [
    { waveform: 0, volume: 0.9, semi_offset: -12, detune_cents: -4.0, pulse_width: 0.5 },
    { waveform: 1, volume: 0.75, semi_offset: -12, detune_cents: 4.0, pulse_width: 0.45 },
    { waveform: 1, volume: 0.7, semi_offset: -24, detune_cents: 0.0, pulse_width: 0.5 },
  ],
};

export const default303Params: Bass303Params = {
  cutoff: 0.45,
  resonance: 0.65,
  envMod: 0.6,
  decay: 0.35,
  accent: 0.7,
  waveform: 0, // Saw
  tune: 0,
  volume: 0.85,
  drive: 0.4,
  driveType: 1, // Soft
  slide: 0.3,
  accentDecay: 0.25,
};

export const default808Params: Drum808Params = {
  bd_decay: 0.55,
  bd_tune: 0.45,
  bd_attack: 0.6,
  sd_tone: 0.5,
  sd_snappy: 0.65,
  hh_decay: 0.35,
  clap_decay: 0.4,
  tom_tune: 0.5,
  volume: 0.88,
};

export const defaultDX7Params: DX7Params = {
  algorithm: 5,
  feedback: 0.3,
  volume: 0.75,
  ops: [
    { ratio: 1.0, detune: 0, level: 1.0, attack: 0.01, decay: 0.8 },
    { ratio: 1.0, detune: 2, level: 0.6, attack: 0.01, decay: 0.5 },
    { ratio: 2.0, detune: -2, level: 0.5, attack: 0.02, decay: 0.4 },
    { ratio: 3.5, detune: 0, level: 0.4, attack: 0.01, decay: 0.3 },
    { ratio: 1.0, detune: 3, level: 0.7, attack: 0.01, decay: 0.6 },
    { ratio: 4.0, detune: 0, level: 0.5, attack: 0.01, decay: 0.3 },
  ],
};

// Generates 64 steps
function createEmptySteps(count: number = 64) {
  return Array.from({ length: count }, () => ({
    active: false,
    note: 60,
    velocity: 100,
    gate: 0.75,
    slide: false,
    accent: false,
  }));
}

export const initialProject: ProjectData = {
  name: 'Moog Minimoog Groove',
  bpm: 124,
  swing: 15,
  stepCount: 16,
  masterVolume: 0.85,
  delayTime: 300,
  delayFeedback: 0.45,
  delayMix: 0.28,
  reverbDecay: 1.8,
  reverbMix: 0.22,
  tracks: [
    // Track 1: Moog VA Lead
    {
      id: 1,
      name: 'Moog Lead',
      engine: 'moog',
      role: 'NORMAL',
      midiChannel: 1,
      volume: 0.85,
      pan: -0.15,
      mute: false,
      solo: false,
      delaySend: 0.4,
      reverbSend: 0.35,
      moogParams: { ...defaultMoogParams },
      steps: createEmptySteps().map((s, idx) => {
        // Melodic synth lead line
        if ([0, 3, 6, 8, 11, 14].includes(idx)) {
          const notes = [69, 72, 74, 76, 74, 72];
          const nIdx = [0, 3, 6, 8, 11, 14].indexOf(idx);
          return { active: true, note: notes[nIdx], velocity: 108, gate: 0.8, slide: idx === 6 };
        }
        return s;
      }),
    },
    // Track 2: Moog VA Sub Bass
    {
      id: 2,
      name: 'Moog Bass',
      engine: 'moog',
      role: 'NORMAL',
      midiChannel: 2,
      volume: 0.9,
      pan: 0.0,
      mute: false,
      solo: false,
      delaySend: 0.1,
      reverbSend: 0.1,
      moogParams: { ...defaultMoogBassParams },
      steps: createEmptySteps().map((s, idx) => {
        // Punchy 16th note bassline
        if ([0, 2, 4, 6, 8, 10, 12, 14].includes(idx)) {
          const notes = [45, 45, 48, 45, 45, 47, 45, 43];
          const nIdx = [0, 2, 4, 6, 8, 10, 12, 14].indexOf(idx);
          return { active: true, note: notes[nIdx], velocity: 115, gate: 0.6, slide: false };
        }
        return s;
      }),
    },
    // Track 3: Drum 808
    {
      id: 3,
      name: '808 Drums',
      engine: 'drum808',
      role: 'NORMAL',
      midiChannel: 10,
      volume: 0.88,
      pan: 0.0,
      mute: false,
      solo: false,
      delaySend: 0.15,
      reverbSend: 0.2,
      drum808Params: { ...default808Params },
      steps: createEmptySteps().map((s, idx) => {
        // Kick on 0, 6, 10; Snare on 4, 12; Hats on every 2
        // We encode note: 36=BD, 38=SD, 42=CH, 46=OH, 39=CP
        if ([0, 6, 10].includes(idx)) {
          return { active: true, note: 36, velocity: 120, gate: 0.8 };
        } else if ([4, 12].includes(idx)) {
          return { active: true, note: 38, velocity: 110, gate: 0.8 };
        } else if ([2, 6, 8, 14].includes(idx)) {
          return { active: true, note: 42, velocity: 90, gate: 0.4 };
        }
        return s;
      }),
    },
    // Track 4: Bass 303 Acid
    {
      id: 4,
      name: 'Acid 303',
      engine: 'bass303',
      role: 'NORMAL',
      midiChannel: 3,
      volume: 0.8,
      pan: 0.25,
      mute: false,
      solo: false,
      delaySend: 0.35,
      reverbSend: 0.25,
      bass303Params: { ...default303Params },
      steps: createEmptySteps().map((s, idx) => {
        if ([1, 4, 7, 9, 13, 15].includes(idx)) {
          const notes = [45, 57, 48, 55, 45, 52];
          const nIdx = [1, 4, 7, 9, 13, 15].indexOf(idx);
          return { active: true, note: notes[nIdx], velocity: 112, gate: 0.85, slide: [4, 9].includes(idx), accent: [1, 7].includes(idx) };
        }
        return s;
      }),
    },
    // Track 5: DX7 FM Chords
    {
      id: 5,
      name: 'DX7 Keys',
      engine: 'dx7',
      role: 'NORMAL',
      midiChannel: 4,
      volume: 0.72,
      pan: -0.25,
      mute: false,
      solo: false,
      delaySend: 0.3,
      reverbSend: 0.45,
      dx7Params: { ...defaultDX7Params },
      steps: createEmptySteps().map((s, idx) => {
        if ([2, 10].includes(idx)) {
          return { active: true, note: 64, velocity: 95, gate: 0.9 };
        }
        return s;
      }),
    },
    // Track 6: Percussion / Hi-Hats
    {
      id: 6,
      name: '808 Hats',
      engine: 'drum808',
      role: 'NORMAL',
      midiChannel: 5,
      volume: 0.7,
      pan: 0.3,
      mute: false,
      solo: false,
      delaySend: 0.2,
      reverbSend: 0.15,
      drum808Params: { ...default808Params },
      steps: createEmptySteps().map((s, idx) => {
        // Continuous 16th hats, with OH on 2, 6, 10, 14
        if (idx % 2 === 0) {
          return { active: true, note: [2, 6, 10, 14].includes(idx) ? 46 : 42, velocity: 85, gate: 0.5 };
        }
        return s;
      }),
    },
    // Track 7: Hand Claps
    {
      id: 7,
      name: '808 Clap',
      engine: 'drum808',
      role: 'NORMAL',
      midiChannel: 6,
      volume: 0.75,
      pan: -0.1,
      mute: false,
      solo: false,
      delaySend: 0.25,
      reverbSend: 0.5,
      drum808Params: { ...default808Params },
      steps: createEmptySteps().map((s, idx) => {
        if ([4, 12].includes(idx)) {
          return { active: true, note: 39, velocity: 110, gate: 0.7 };
        }
        return s;
      }),
    },
    // Track 8: Poly Moog Pad / Pluck
    {
      id: 8,
      name: 'Moog Poly',
      engine: 'moog',
      role: 'NORMAL',
      midiChannel: 7,
      volume: 0.75,
      pan: 0.2,
      mute: false,
      solo: false,
      delaySend: 0.35,
      reverbSend: 0.5,
      moogParams: {
        ...defaultMoogParams,
        cutoff: 0.62,
        resonance: 0.25,
        amp_attack: 0.1,
        amp_decay: 0.6,
        amp_sustain: 0.6,
        amp_release: 0.5,
      },
      steps: createEmptySteps().map((s, idx) => {
        if ([0, 8].includes(idx)) {
          return { active: true, note: idx === 0 ? 57 : 60, velocity: 100, gate: 0.95 };
        }
        return s;
      }),
    },
  ],
};
