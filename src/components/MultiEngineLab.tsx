import React from 'react';
import { ProjectData, Bass303Params, Drum808Params, DX7Params } from '../types/synth';
import { AudioEngine } from '../audio/AudioEngine';
import { Radio, Disc, Zap } from 'lucide-react';

interface EngineLabProps {
  project: ProjectData;
  engine: AudioEngine | null;
  activeTrackIndex: number;
  onUpdateProject: (p: ProjectData) => void;
}

export const MultiEngineLab: React.FC<EngineLabProps> = ({
  project,
  engine,
  activeTrackIndex,
  onUpdateProject,
}) => {
  const activeTrack = project.tracks[activeTrackIndex];

  // 303 Parameters
  const bass303 = activeTrack.bass303Params || {
    cutoff: 0.45,
    resonance: 0.65,
    envMod: 0.6,
    decay: 0.35,
    accent: 0.7,
    waveform: 0,
    tune: 0,
    volume: 0.85,
    drive: 0.4,
    driveType: 1,
    slide: 0.3,
    accentDecay: 0.25,
  };

  // 808 Parameters
  const drum808 = activeTrack.drum808Params || {
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

  // DX7 Parameters
  const dx7 = activeTrack.dx7Params || {
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

  const update303 = (p: Bass303Params) => {
    const updatedTracks = [...project.tracks];
    updatedTracks[activeTrackIndex] = { ...activeTrack, engine: 'bass303', bass303Params: p };
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  const update808 = (p: Drum808Params) => {
    const updatedTracks = [...project.tracks];
    updatedTracks[activeTrackIndex] = { ...activeTrack, engine: 'drum808', drum808Params: p };
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  const updateDX7 = (p: DX7Params) => {
    const updatedTracks = [...project.tracks];
    updatedTracks[activeTrackIndex] = { ...activeTrack, engine: 'dx7', dx7Params: p };
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  const triggerDrumPad = (note: number) => {
    engine?.triggerNoteOn(activeTrackIndex, note, 0.95);
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-[#172023] rounded-2xl border border-[#2b393d] p-6 shadow-xl">
      <div className="pb-5 border-b border-[#28363a] mb-6">
        <h2 className="text-xl font-bold font-mono tracking-tight text-[#a9efd7] flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#a9efd7]" />
          MULTI-ENGINE SOUND LAB
        </h2>
        <p className="text-xs text-[#809aa0]">
          TB-303 Acid Synthesizer · TR-808 Analog Percussion Pads · DX7 6-OP FM Engine
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: TB-303 Acid Synth */}
        <div className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#f2bf6b] flex items-center gap-1.5">
              <Radio className="w-4 h-4" /> BASS 303 ACID
            </span>
            <div className="flex gap-1 bg-[#121a1d] p-0.5 rounded border border-[#28393d]">
              <button
                onClick={() => update303({ ...bass303, waveform: 0 })}
                className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold ${
                  bass303.waveform === 0 ? 'bg-[#f2bf6b] text-black' : 'text-[#8aa0a5]'
                }`}
              >
                SAW
              </button>
              <button
                onClick={() => update303({ ...bass303, waveform: 1 })}
                className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold ${
                  bass303.waveform === 1 ? 'bg-[#f2bf6b] text-black' : 'text-[#8aa0a5]'
                }`}
              >
                SQR
              </button>
            </div>
          </div>

          <div className="space-y-2.5 text-[10px] font-mono text-[#8aa0a5]">
            <div>
              <div className="flex justify-between">
                <span>CUTOFF</span>
                <span className="text-[#f2bf6b]">{Math.round(bass303.cutoff * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={bass303.cutoff}
                onChange={(e) => update303({ ...bass303, cutoff: parseFloat(e.target.value) })}
                className="w-full accent-[#f2bf6b]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>RESONANCE</span>
                <span className="text-[#f2bf6b]">{Math.round(bass303.resonance * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.95"
                step="0.01"
                value={bass303.resonance}
                onChange={(e) => update303({ ...bass303, resonance: parseFloat(e.target.value) })}
                className="w-full accent-[#f2bf6b]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>ENV MOD & ACCENT</span>
                <span className="text-[#f2bf6b]">{Math.round(bass303.envMod * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={bass303.envMod}
                onChange={(e) => update303({ ...bass303, envMod: parseFloat(e.target.value) })}
                className="w-full accent-[#f2bf6b]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>DECAY</span>
                <span className="text-[#f2bf6b]">{Math.round(bass303.decay * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.01"
                value={bass303.decay}
                onChange={(e) => update303({ ...bass303, decay: parseFloat(e.target.value) })}
                className="w-full accent-[#f2bf6b]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>DRIVE DISTORTION</span>
                <span className="text-[#f2bf6b]">{Math.round(bass303.drive * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={bass303.drive}
                onChange={(e) => update303({ ...bass303, drive: parseFloat(e.target.value) })}
                className="w-full accent-[#f2bf6b]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: TR-808 Drum Machine Pads */}
        <div className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-[#ff8e82] flex items-center gap-1.5">
            <Disc className="w-4 h-4" /> TR-808 DRUM PADS
          </span>

          <div className="grid grid-cols-3 gap-2">
            {[
              { note: 36, label: 'BASS DRUM', sub: 'BD' },
              { note: 38, label: 'SNARE', sub: 'SD' },
              { note: 39, label: 'CLAP', sub: 'CP' },
              { note: 42, label: 'CLOSED HAT', sub: 'CH' },
              { note: 46, label: 'OPEN HAT', sub: 'OH' },
              { note: 56, label: 'COWBELL', sub: 'CB' },
              { note: 41, label: 'LOW TOM', sub: 'LT' },
              { note: 45, label: 'MID TOM', sub: 'MT' },
              { note: 48, label: 'HIGH TOM', sub: 'HT' },
            ].map((pad) => (
              <button
                key={pad.note}
                onClick={() => triggerDrumPad(pad.note)}
                className="h-14 rounded-lg bg-[#273439] hover:bg-[#ff8e82] hover:text-black active:scale-95 transition-all border border-[#3b4e54] flex flex-col items-center justify-center p-1"
              >
                <span className="text-xs font-mono font-bold">{pad.sub}</span>
                <span className="text-[8px] font-mono opacity-70">{pad.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 space-y-2 text-[10px] font-mono text-[#8aa0a5]">
            <div className="flex justify-between">
              <span>BD DECAY</span>
              <span className="text-[#ff8e82]">{Math.round(drum808.bd_decay * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={drum808.bd_decay}
              onChange={(e) => update808({ ...drum808, bd_decay: parseFloat(e.target.value) })}
              className="w-full accent-[#ff8e82]"
            />
          </div>
        </div>

        {/* Section 3: DX7 6-Operator FM Synth */}
        <div className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#71c4f5] flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> DX7 6-OP FM
            </span>
            <span className="text-[10px] font-mono text-[#8aa0a5]">ALGO #{dx7.algorithm}</span>
          </div>

          <div className="space-y-2 text-[10px] font-mono text-[#8aa0a5]">
            <div>
              <div className="flex justify-between">
                <span>FM ALGORITHM (1-32)</span>
                <span className="text-[#71c4f5]">#{dx7.algorithm}</span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                step="1"
                value={dx7.algorithm}
                onChange={(e) => updateDX7({ ...dx7, algorithm: parseInt(e.target.value) })}
                className="w-full accent-[#71c4f5]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>OP 6 FEEDBACK</span>
                <span className="text-[#71c4f5]">{Math.round(dx7.feedback * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={dx7.feedback}
                onChange={(e) => updateDX7({ ...dx7, feedback: parseFloat(e.target.value) })}
                className="w-full accent-[#71c4f5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {[0, 1, 2, 3].map((opIdx) => (
                <div key={opIdx} className="bg-[#141d20] p-2 rounded border border-[#27373c]">
                  <span className="text-[9px] font-mono font-bold text-[#71c4f5] block mb-1">
                    OP {opIdx + 1} RATIO
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.5"
                    value={dx7.ops[opIdx].ratio}
                    onChange={(e) => {
                      const newOps = [...dx7.ops] as any;
                      newOps[opIdx] = { ...newOps[opIdx], ratio: parseFloat(e.target.value) };
                      updateDX7({ ...dx7, ops: newOps });
                    }}
                    className="w-full accent-[#71c4f5]"
                  />
                  <div className="text-[9px] text-right text-[#b8d6e2]">
                    {dx7.ops[opIdx].ratio}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
