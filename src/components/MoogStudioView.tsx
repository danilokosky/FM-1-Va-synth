import React, { useRef, useEffect } from 'react';
import { MoogParams, ProjectData } from '../types/synth';
import { Sliders, Activity, Disc, Layers } from 'lucide-react';

interface MoogStudioProps {
  project: ProjectData;
  activeTrackIndex: number;
  onUpdateProject: (p: ProjectData) => void;
}

export const MoogStudioView: React.FC<MoogStudioProps> = ({
  project,
  activeTrackIndex,
  onUpdateProject,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeTrack = project.tracks[activeTrackIndex];
  const params: MoogParams = activeTrack.moogParams || {
    master_volume: 0.85,
    cutoff: 0.55,
    resonance: 0.45,
    envMod: 0.5,
    glide: 0.08,
    filter_attack: 0.02,
    filter_decay: 0.3,
    filter_sustain: 0.3,
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

  const updateParams = (newParams: MoogParams) => {
    const updatedTracks = [...project.tracks];
    updatedTracks[activeTrackIndex] = {
      ...activeTrack,
      engine: 'moog',
      moogParams: newParams,
    };
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  // Draw Moog 4-Pole Ladder Filter frequency response graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0f1719';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (log frequency scale & dB)
    ctx.strokeStyle = '#1b2a2e';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Moog Ladder 24dB/oct response curve
    ctx.beginPath();
    ctx.strokeStyle = '#a9efd7';
    ctx.lineWidth = 2.5;

    const cutoffX = params.cutoff * (w - 20) + 10;
    const resoHeight = params.resonance * 45;

    for (let x = 0; x < w; x++) {
      let y = 40;
      if (x < cutoffX - 30) {
        y = 40;
      } else if (x >= cutoffX - 30 && x <= cutoffX) {
        // Resonance peak before 24dB rolloff
        const peakProg = (x - (cutoffX - 30)) / 30;
        y = 40 - resoHeight * Math.sin(peakProg * Math.PI * 0.5);
      } else {
        // 4-pole steep rolloff (24 dB per octave)
        const diff = x - cutoffX;
        y = (40 - resoHeight) + Math.pow(diff / 12, 1.9) * 8;
        if (y > h) y = h;
      }

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill underneath curve with gradient
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(169, 239, 215, 0.25)');
    grad.addColorStop(1, 'rgba(169, 239, 215, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Filter Cutoff Marker point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cutoffX, 40 - resoHeight, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.font = '10px Consolas, monospace';
    ctx.fillStyle = '#6a8a8e';
    ctx.fillText('20Hz', 8, h - 6);
    ctx.fillText('1kHz', w * 0.45, h - 6);
    ctx.fillText('20kHz', w - 38, h - 6);
    ctx.fillStyle = '#a9efd7';
    ctx.fillText(`MOOG 4-POLE 24dB/OCT (CUTOFF: ${Math.round(params.cutoff * 100)}%)`, 10, 18);
  }, [params.cutoff, params.resonance]);

  // Moog Presets
  const loadPreset = (presetName: string) => {
    let p: MoogParams;
    switch (presetName) {
      case 'minimoog_lead':
        p = {
          master_volume: 0.88,
          cutoff: 0.65,
          resonance: 0.45,
          envMod: 0.5,
          glide: 0.08,
          filter_attack: 0.01,
          filter_decay: 0.28,
          filter_sustain: 0.4,
          filter_release: 0.3,
          amp_attack: 0.01,
          amp_decay: 0.4,
          amp_sustain: 0.75,
          amp_release: 0.3,
          osc: [
            { waveform: 0, volume: 0.85, semi_offset: 0, detune_cents: -5.0, pulse_width: 0.5 },
            { waveform: 0, volume: 0.8, semi_offset: 0, detune_cents: 5.0, pulse_width: 0.5 },
            { waveform: 1, volume: 0.6, semi_offset: -12, detune_cents: 0.0, pulse_width: 0.5 },
          ],
        };
        break;
      case 'taurus_bass':
        p = {
          master_volume: 0.92,
          cutoff: 0.35,
          resonance: 0.55,
          envMod: 0.7,
          glide: 0.04,
          filter_attack: 0.005,
          filter_decay: 0.2,
          filter_sustain: 0.1,
          filter_release: 0.15,
          amp_attack: 0.005,
          amp_decay: 0.25,
          amp_sustain: 0.4,
          amp_release: 0.2,
          osc: [
            { waveform: 0, volume: 0.9, semi_offset: -12, detune_cents: -4.0, pulse_width: 0.5 },
            { waveform: 1, volume: 0.8, semi_offset: -12, detune_cents: 4.0, pulse_width: 0.45 },
            { waveform: 1, volume: 0.75, semi_offset: -24, detune_cents: 0.0, pulse_width: 0.5 },
          ],
        };
        break;
      case 'poly_d_brass':
        p = {
          master_volume: 0.82,
          cutoff: 0.48,
          resonance: 0.28,
          envMod: 0.6,
          glide: 0.02,
          filter_attack: 0.08,
          filter_decay: 0.4,
          filter_sustain: 0.5,
          filter_release: 0.4,
          amp_attack: 0.05,
          amp_decay: 0.5,
          amp_sustain: 0.65,
          amp_release: 0.4,
          osc: [
            { waveform: 0, volume: 0.8, semi_offset: 0, detune_cents: -7.0, pulse_width: 0.5 },
            { waveform: 0, volume: 0.8, semi_offset: 0, detune_cents: 7.0, pulse_width: 0.5 },
            { waveform: 0, volume: 0.65, semi_offset: -12, detune_cents: 0.0, pulse_width: 0.5 },
          ],
        };
        break;
      case 'prog_pluck':
        p = {
          master_volume: 0.85,
          cutoff: 0.25,
          resonance: 0.6,
          envMod: 0.85,
          glide: 0.0,
          filter_attack: 0.001,
          filter_decay: 0.18,
          filter_sustain: 0.0,
          filter_release: 0.15,
          amp_attack: 0.002,
          amp_decay: 0.22,
          amp_sustain: 0.05,
          amp_release: 0.2,
          osc: [
            { waveform: 0, volume: 0.85, semi_offset: 0, detune_cents: -3.0, pulse_width: 0.5 },
            { waveform: 1, volume: 0.7, semi_offset: 7, detune_cents: 3.0, pulse_width: 0.35 },
            { waveform: 0, volume: 0.6, semi_offset: -12, detune_cents: 0.0, pulse_width: 0.5 },
          ],
        };
        break;
      case 'space_sweep':
        p = {
          master_volume: 0.8,
          cutoff: 0.4,
          resonance: 0.88,
          envMod: 0.9,
          glide: 0.18,
          filter_attack: 0.45,
          filter_decay: 0.8,
          filter_sustain: 0.3,
          filter_release: 0.6,
          amp_attack: 0.15,
          amp_decay: 0.8,
          amp_sustain: 0.7,
          amp_release: 0.65,
          osc: [
            { waveform: 0, volume: 0.75, semi_offset: 0, detune_cents: -12.0, pulse_width: 0.5 },
            { waveform: 1, volume: 0.7, semi_offset: 0, detune_cents: 12.0, pulse_width: 0.65 },
            { waveform: 2, volume: 0.8, semi_offset: -12, detune_cents: 0.0, pulse_width: 0.5 },
          ],
        };
        break;
      default:
        return;
    }
    updateParams(p);
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-[#172023] rounded-2xl border border-[#2b393d] p-6 shadow-xl">
      {/* Studio Header & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between pb-5 border-b border-[#28363a] gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[#a9efd7] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#a9efd7]" />
            VIRTUAL ANALOG MOOG STUDIO
          </h2>
          <p className="text-xs text-[#809aa0]">
            3 Oscillators · 4-Pole Ladder Filter with non-linear saturation · ADSR Envelopes
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-[#718b91] uppercase mr-1">PRESETS:</span>
          {[
            { id: 'minimoog_lead', label: 'Minimoog Lead' },
            { id: 'taurus_bass', label: 'Taurus Bass' },
            { id: 'poly_d_brass', label: 'Poly D Brass' },
            { id: 'prog_pluck', label: 'Prog Pluck' },
            { id: 'space_sweep', label: 'Space Sweep' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-[#243135] text-[#a9efd7] border border-[#3b4e54] hover:bg-[#32454a] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: 3 Oscillators Mixer */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#b4cad0]">
            <Disc className="w-4 h-4 text-[#a9efd7]" />
            TRIPLE OSCILLATOR BANK
          </div>

          {[0, 1, 2].map((idx) => {
            const osc = params.osc[idx];
            return (
              <div
                key={idx}
                className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#a9efd7]">
                    OSCILLATOR {idx + 1} {idx === 2 ? '(SUB-OSC)' : ''}
                  </span>
                  {/* Waveform Selector */}
                  <div className="flex items-center gap-1 bg-[#121a1d] p-0.5 rounded-lg border border-[#263539]">
                    {['Saw', 'Pulse', 'Tri', 'Sine'].map((waveName, wIdx) => (
                      <button
                        key={waveName}
                        onClick={() => {
                          const newOscs = [...params.osc] as [any, any, any];
                          newOscs[idx] = { ...osc, waveform: wIdx };
                          updateParams({ ...params, osc: newOscs });
                        }}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold transition-all ${
                          osc.waveform === wIdx
                            ? 'bg-[#a9efd7] text-[#12221e]'
                            : 'text-[#7e969c] hover:text-[#d3e3e7]'
                        }`}
                      >
                        {waveName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Semitone Pitch Shift */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                      <span>SEMI</span>
                      <span className="text-[#e2ecea]">{osc.semi_offset > 0 ? `+${osc.semi_offset}` : osc.semi_offset}st</span>
                    </div>
                    <input
                      type="range"
                      min="-24"
                      max="24"
                      step="1"
                      value={osc.semi_offset}
                      onChange={(e) => {
                        const newOscs = [...params.osc] as [any, any, any];
                        newOscs[idx] = { ...osc, semi_offset: parseInt(e.target.value) };
                        updateParams({ ...params, osc: newOscs });
                      }}
                      className="w-full accent-[#a9efd7]"
                    />
                  </div>

                  {/* Fine Detune Cents */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                      <span>DETUNE</span>
                      <span className="text-[#e2ecea]">{Math.round(osc.detune_cents)}c</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={osc.detune_cents}
                      onChange={(e) => {
                        const newOscs = [...params.osc] as [any, any, any];
                        newOscs[idx] = { ...osc, detune_cents: parseFloat(e.target.value) };
                        updateParams({ ...params, osc: newOscs });
                      }}
                      className="w-full accent-[#a9efd7]"
                    />
                  </div>

                  {/* Volume Level */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                      <span>LEVEL</span>
                      <span className="text-[#e2ecea]">{Math.round(osc.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={osc.volume}
                      onChange={(e) => {
                        const newOscs = [...params.osc] as [any, any, any];
                        newOscs[idx] = { ...osc, volume: parseFloat(e.target.value) };
                        updateParams({ ...params, osc: newOscs });
                      }}
                      className="w-full accent-[#a9efd7]"
                    />
                  </div>
                </div>

                {/* Pulse Width (only active if Pulse waveform) */}
                {osc.waveform === 1 && (
                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                      <span>PULSE WIDTH</span>
                      <span className="text-[#a9efd7]">{Math.round(osc.pulse_width * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={osc.pulse_width}
                      onChange={(e) => {
                        const newOscs = [...params.osc] as [any, any, any];
                        newOscs[idx] = { ...osc, pulse_width: parseFloat(e.target.value) };
                        updateParams({ ...params, osc: newOscs });
                      }}
                      className="w-full accent-[#a9efd7]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Moog 4-Pole Ladder Filter & ADSR */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#b4cad0]">
            <Layers className="w-4 h-4 text-[#a9efd7]" />
            MOOG LADDER FILTER (4-POLE) & ENVELOPES
          </div>

          {/* Filter Response Canvas */}
          <div className="bg-[#1b262a] p-3 rounded-xl border border-[#2e3e44]">
            <canvas ref={canvasRef} width={460} height={130} className="w-full h-[130px] rounded-lg shadow-inner" />

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                  <span>CUTOFF</span>
                  <span className="text-[#a9efd7] font-bold">{Math.round(params.cutoff * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.98"
                  step="0.01"
                  value={params.cutoff}
                  onChange={(e) => updateParams({ ...params, cutoff: parseFloat(e.target.value) })}
                  className="w-full accent-[#a9efd7]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                  <span>RESONANCE</span>
                  <span className="text-[#a9efd7] font-bold">{Math.round(params.resonance * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.95"
                  step="0.01"
                  value={params.resonance}
                  onChange={(e) => updateParams({ ...params, resonance: parseFloat(e.target.value) })}
                  className="w-full accent-[#a9efd7]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                  <span>ENV MOD</span>
                  <span className="text-[#a9efd7] font-bold">{Math.round(params.envMod * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={params.envMod}
                  onChange={(e) => updateParams({ ...params, envMod: parseFloat(e.target.value) })}
                  className="w-full accent-[#a9efd7]"
                />
              </div>
            </div>
          </div>

          {/* Envelopes: Filter & Amp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filter ADSR */}
            <div className="bg-[#1b262a] p-3 rounded-xl border border-[#2e3e44]">
              <span className="text-xs font-mono font-bold text-[#a9efd7] block mb-2">FILTER ENVELOPE</span>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-[#8aa0a5]">
                <div>
                  <span>A: {params.filter_attack.toFixed(2)}s</span>
                  <input
                    type="range"
                    min="0.001"
                    max="1.5"
                    step="0.01"
                    value={params.filter_attack}
                    onChange={(e) => updateParams({ ...params, filter_attack: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
                <div>
                  <span>D: {params.filter_decay.toFixed(2)}s</span>
                  <input
                    type="range"
                    min="0.01"
                    max="2.0"
                    step="0.01"
                    value={params.filter_decay}
                    onChange={(e) => updateParams({ ...params, filter_decay: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
                <div>
                  <span>S: {Math.round(params.filter_sustain * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={params.filter_sustain}
                    onChange={(e) => updateParams({ ...params, filter_sustain: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
                <div>
                  <span>R: {params.filter_release.toFixed(2)}s</span>
                  <input
                    type="range"
                    min="0.01"
                    max="2.5"
                    step="0.01"
                    value={params.filter_release}
                    onChange={(e) => updateParams({ ...params, filter_release: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Amp ADSR */}
            <div className="bg-[#1b262a] p-3 rounded-xl border border-[#2e3e44]">
              <span className="text-xs font-mono font-bold text-[#a9efd7] block mb-2">AMPLITUDE ENVELOPE</span>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-[#8aa0a5]">
                <div>
                  <span>A: {params.amp_attack.toFixed(2)}s</span>
                  <input
                    type="range"
                    min="0.001"
                    max="1.5"
                    step="0.01"
                    value={params.amp_attack}
                    onChange={(e) => updateParams({ ...params, amp_attack: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
                <div>
                  <span>D: {params.amp_decay.toFixed(2)}s</span>
                  <input
                    type="range"
                    min="0.01"
                    max="2.0"
                    step="0.01"
                    value={params.amp_decay}
                    onChange={(e) => updateParams({ ...params, amp_decay: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
                <div>
                  <span>S: {Math.round(params.amp_sustain * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={params.amp_sustain}
                    onChange={(e) => updateParams({ ...params, amp_sustain: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
                <div>
                  <span>R: {params.amp_release.toFixed(2)}s</span>
                  <input
                    type="range"
                    min="0.01"
                    max="2.5"
                    step="0.01"
                    value={params.amp_release}
                    onChange={(e) => updateParams({ ...params, amp_release: parseFloat(e.target.value) })}
                    className="w-full accent-[#a9efd7] mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Glide & Master Volume */}
          <div className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                <span>PORTAMENTO / GLIDE</span>
                <span className="text-[#a9efd7]">{Math.round(params.glide * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.4"
                step="0.01"
                value={params.glide}
                onChange={(e) => updateParams({ ...params, glide: parseFloat(e.target.value) })}
                className="w-full accent-[#a9efd7]"
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-mono text-[#7b9298] mb-1">
                <span>ENGINE MASTER VOL</span>
                <span className="text-[#a9efd7]">{Math.round(params.master_volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={params.master_volume}
                onChange={(e) => updateParams({ ...params, master_volume: parseFloat(e.target.value) })}
                className="w-full accent-[#a9efd7]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
