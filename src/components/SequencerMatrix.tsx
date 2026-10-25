import React, { useState } from 'react';
import { ProjectData, TrackData, StepData } from '../types/synth';
import { VolumeX, Volume2, Music, Disc, Layers, Sliders, ChevronDown } from 'lucide-react';

interface SequencerProps {
  project: ProjectData;
  activeTrackIndex: number;
  setActiveTrackIndex: (idx: number) => void;
  onUpdateProject: (p: ProjectData) => void;
  currentStep: number;
}

export const SequencerMatrix: React.FC<SequencerProps> = ({
  project,
  activeTrackIndex,
  setActiveTrackIndex,
  onUpdateProject,
  currentStep,
}) => {
  const [selectedOctave, setSelectedOctave] = useState(4);

  const toggleStep = (trackIdx: number, stepIdx: number) => {
    const updatedTracks = [...project.tracks];
    const track = { ...updatedTracks[trackIdx] };
    const steps = [...track.steps];
    const current = steps[stepIdx] || { active: false, note: 60, velocity: 100, gate: 0.75 };

    steps[stepIdx] = {
      ...current,
      active: !current.active,
      note: current.note || 60,
    };
    track.steps = steps;
    updatedTracks[trackIdx] = track;
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  const toggleMute = (trackIdx: number) => {
    const updatedTracks = [...project.tracks];
    updatedTracks[trackIdx] = {
      ...updatedTracks[trackIdx],
      mute: !updatedTracks[trackIdx].mute,
    };
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  const toggleSolo = (trackIdx: number) => {
    const updatedTracks = [...project.tracks];
    updatedTracks[trackIdx] = {
      ...updatedTracks[trackIdx],
      solo: !updatedTracks[trackIdx].solo,
    };
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  const changeEngine = (trackIdx: number, newEngine: any) => {
    const updatedTracks = [...project.tracks];
    updatedTracks[trackIdx] = {
      ...updatedTracks[trackIdx],
      engine: newEngine,
    };
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto bg-[#172023] rounded-2xl border border-[#2b393d] p-6 shadow-xl">
      {/* Sequencer Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#28363a] gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[#a9efd7] flex items-center gap-2">
            <Music className="w-5 h-5 text-[#a9efd7]" />
            8-TRACK STEP SEQUENCER
          </h2>
          <p className="text-xs text-[#809aa0]">
            16 / 32 / 64-step polyphonic pattern editor · Step recording · Mute / Solo groups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#121a1d] px-3 py-1.5 rounded-lg border border-[#28363a]">
            <span className="text-[10px] font-mono text-[#718b91]">STEPS:</span>
            {[16, 32, 64].map((cnt) => (
              <button
                key={cnt}
                onClick={() => onUpdateProject({ ...project, stepCount: cnt })}
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                  project.stepCount === cnt
                    ? 'bg-[#a9efd7] text-[#12221e]'
                    : 'text-[#8aa0a5] hover:bg-[#202c30]'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-[#121a1d] px-3 py-1.5 rounded-lg border border-[#28363a]">
            <span className="text-[10px] font-mono text-[#718b91]">SWING:</span>
            <input
              type="range"
              min="0"
              max="70"
              value={project.swing}
              onChange={(e) => onUpdateProject({ ...project, swing: parseInt(e.target.value) || 0 })}
              className="w-20 accent-[#a9efd7]"
            />
            <span className="text-xs font-mono font-bold text-[#e1ecea]">{project.swing}%</span>
          </div>
        </div>
      </div>

      {/* Sequencer Tracks Matrix */}
      <div className="flex flex-col gap-2.5 overflow-x-auto pb-4">
        {project.tracks.map((track, tIdx) => {
          const isSelected = activeTrackIndex === tIdx;

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-[#1e2a2e] border-[#44665a] shadow-md'
                  : 'bg-[#151d20] border-[#253236] hover:border-[#35454a]'
              }`}
            >
              {/* Track Info & Controls Header */}
              <div
                className="w-48 flex-shrink-0 flex items-center justify-between cursor-pointer"
                onClick={() => setActiveTrackIndex(tIdx)}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#2b3a3e] text-[9px] font-mono font-bold flex items-center justify-center text-[#a9efd7]">
                      {track.id}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#d8e6e4] truncate max-w-[90px]">
                      {track.name}
                    </span>
                  </div>
                  {/* Engine dropdown */}
                  <div className="mt-1 flex items-center gap-1">
                    <select
                      value={track.engine}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => changeEngine(tIdx, e.target.value)}
                      className="bg-[#12191b] text-[10px] font-mono text-[#a9efd7] rounded px-1.5 py-0.5 border border-[#28393d] outline-none"
                    >
                      <option value="moog">MOOG VA</option>
                      <option value="bass303">303 ACID</option>
                      <option value="drum808">808 DRUMS</option>
                      <option value="dx7">DX7 FM</option>
                    </select>
                  </div>
                </div>

                {/* Mute & Solo Buttons */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleMute(tIdx)}
                    className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition-colors ${
                      track.mute
                        ? 'bg-[#a33d32] text-white'
                        : 'bg-[#253236] text-[#8ea4a9] hover:bg-[#34444a]'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => toggleSolo(tIdx)}
                    className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition-colors ${
                      track.solo
                        ? 'bg-[#cca843] text-[#12191b]'
                        : 'bg-[#253236] text-[#8ea4a9] hover:bg-[#34444a]'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>

              {/* 16 visible Steps Grid (up to project.stepCount) */}
              <div className="flex-1 flex gap-1.5 min-w-[500px]">
                {track.steps.slice(0, Math.min(16, project.stepCount)).map((step, sIdx) => {
                  const isCurrent = currentStep === sIdx;
                  const isBeatStart = sIdx % 4 === 0;

                  return (
                    <button
                      key={sIdx}
                      onClick={() => toggleStep(tIdx, sIdx)}
                      className={`relative flex-1 h-11 rounded-lg border flex flex-col items-center justify-between p-1 transition-all ${
                        step.active
                          ? isCurrent
                            ? 'bg-[#ffffff] text-black border-[#ffffff] shadow-md'
                            : track.engine === 'moog'
                            ? 'bg-[#407a68] border-[#70bfa6] text-[#e8fff7]'
                            : track.engine === 'bass303'
                            ? 'bg-[#825c27] border-[#d8a452] text-[#fff6e2]'
                            : track.engine === 'drum808'
                            ? 'bg-[#7a3b34] border-[#c4695e] text-[#ffebe8]'
                            : 'bg-[#2c5b7d] border-[#5da0d1] text-[#eef7ff]'
                          : isCurrent
                          ? 'bg-[#2f4044] border-[#a9efd7]'
                          : isBeatStart
                          ? 'bg-[#1b2528] border-[#314247] hover:border-[#4d666d]'
                          : 'bg-[#12191b] border-[#222e32] hover:border-[#384b52]'
                      }`}
                    >
                      {/* Step index dot */}
                      <span className="text-[8px] font-mono opacity-60">
                        {(sIdx + 1).toString().padStart(2, '0')}
                      </span>

                      {/* Velocity bar or note indicator */}
                      {step.active && (
                        <span className="text-[9px] font-mono font-bold leading-none">
                          {track.engine === 'drum808' ? 'HIT' : 'NOTE'}
                        </span>
                      )}

                      {/* Accent / Slide dot */}
                      {step.slide && <span className="w-1 h-1 rounded-full bg-[#ffea75]"></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
