import React, { useEffect, useRef, useState } from 'react';
import { ProjectData, TrackData } from '../types/synth';
import { AudioEngine } from '../audio/AudioEngine';
import { Play, Square, Circle, AlertCircle, RefreshCw, Volume2, Music } from 'lucide-react';

interface HardwareProps {
  project: ProjectData;
  engine: AudioEngine | null;
  activeTrackIndex: number;
  setActiveTrackIndex: (idx: number) => void;
  onUpdateProject: (p: ProjectData) => void;
  currentStep: number;
}

// 27-key micro keyboard definition (F3 to G5)
const PIANO_KEYS = [
  { note: 53, name: 'F3', black: false },
  { note: 54, name: 'F#3', black: true },
  { note: 55, name: 'G3', black: false },
  { note: 56, name: 'G#3', black: true },
  { note: 57, name: 'A3', black: false },
  { note: 58, name: 'A#3', black: true },
  { note: 59, name: 'B3', black: false },
  { note: 60, name: 'C4', black: false },
  { note: 61, name: 'C#4', black: true },
  { note: 62, name: 'D4', black: false },
  { note: 63, name: 'D#4', black: true },
  { note: 64, name: 'E4', black: false },
  { note: 65, name: 'F4', black: false },
  { note: 66, name: 'F#4', black: true },
  { note: 67, name: 'G4', black: false },
  { note: 68, name: 'G#4', black: true },
  { note: 69, name: 'A4', black: false },
  { note: 70, name: 'A#4', black: true },
  { note: 71, name: 'B4', black: false },
  { note: 72, name: 'C5', black: false },
  { note: 73, name: 'C#5', black: true },
  { note: 74, name: 'D5', black: false },
  { note: 75, name: 'D#5', black: true },
  { note: 76, name: 'E5', black: false },
  { note: 77, name: 'F5', black: false },
  { note: 78, name: 'F#5', black: true },
  { note: 79, name: 'G5', black: false },
];

export const HardwareFaceplate: React.FC<HardwareProps> = ({
  project,
  engine,
  activeTrackIndex,
  setActiveTrackIndex,
  onUpdateProject,
  currentStep,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [octaveShift, setOctaveShift] = useState(0);
  const [heldKeys, setHeldKeys] = useState<Set<number>>(new Set());
  const [encoderAngles, setEncoderAngles] = useState({ k1: 0, k2: 0, k3: 0, k4: 0, vol: 0 });

  const activeTrack = project.tracks[activeTrackIndex] || project.tracks[0];

  // Sync playing state
  useEffect(() => {
    if (engine) {
      setIsPlaying(engine.getIsPlaying());
    }
  }, [engine, currentStep]);

  // Canvas visualizer loop for OLED screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const waveData = new Uint8Array(128);
    const freqData = new Uint8Array(64);

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;

      // Dark CRT phosphor background
      ctx.fillStyle = '#0a1012';
      ctx.fillRect(0, 0, w, h);

      // CRT Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      // Top Status Bar
      ctx.fillStyle = '#142525';
      ctx.fillRect(0, 0, w, 28);
      ctx.font = 'bold 11px Consolas, monospace';
      ctx.fillStyle = '#a9efd7';
      ctx.fillText(`TRK ${activeTrack.id}: ${activeTrack.name.toUpperCase()}`, 8, 18);

      ctx.fillStyle = '#6ab89d';
      ctx.fillText(`${project.bpm} BPM`, w - 95, 18);
      ctx.fillText(`S:${(currentStep + 1).toString().padStart(2, '0')}`, w - 40, 18);

      // Engine badge
      ctx.fillStyle = activeTrack.engine === 'moog' ? '#e6a23c' : '#3993d0';
      ctx.fillRect(8, 34, 48, 14);
      ctx.fillStyle = '#0a1012';
      ctx.font = 'bold 9px Consolas, monospace';
      ctx.fillText(activeTrack.engine.toUpperCase(), 12, 44);

      // Fetch live audio data
      if (engine) {
        engine.getWaveformData(waveData);
        engine.getFrequencyData(freqData);
      }

      // Real-time Oscilloscope Waveform (phosphor green line)
      ctx.strokeStyle = '#a9efd7';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const sliceWidth = (w - 16) / 128;
      let x = 8;
      for (let i = 0; i < 128; i++) {
        const v = waveData[i] / 128.0;
        const y = 80 + (v - 1.0) * 35;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // FFT Spectrum Bars (subtle in background)
      ctx.fillStyle = 'rgba(169, 239, 215, 0.22)';
      const barWidth = (w - 16) / 32;
      for (let i = 0; i < 32; i++) {
        const val = (freqData[i] / 255.0) * 40;
        ctx.fillRect(8 + i * barWidth, 125 - val, barWidth - 1, val);
      }

      // Lower Parameter Grid Display (showing K1-K4 values)
      ctx.fillStyle = '#111d1e';
      ctx.fillRect(8, 134, w - 16, 68);
      ctx.strokeStyle = '#27443e';
      ctx.strokeRect(8, 134, w - 16, 68);

      ctx.font = '10px Consolas, monospace';
      if (activeTrack.engine === 'moog' && activeTrack.moogParams) {
        const p = activeTrack.moogParams;
        ctx.fillStyle = '#6ab89d';
        ctx.fillText('CUTOFF', 14, 150);
        ctx.fillText('RESO', 70, 150);
        ctx.fillText('ENV MOD', 126, 150);
        ctx.fillText('GLIDE', 182, 150);

        ctx.fillStyle = '#e2f7ed';
        ctx.font = 'bold 13px Consolas, monospace';
        ctx.fillText(`${Math.round(p.cutoff * 100)}%`, 14, 170);
        ctx.fillText(`${Math.round(p.resonance * 100)}%`, 70, 170);
        ctx.fillText(`${Math.round(p.envMod * 100)}%`, 126, 170);
        ctx.fillText(`${Math.round(p.glide * 100)}%`, 182, 170);

        // Subline
        ctx.fillStyle = '#4e7b6d';
        ctx.font = '9px Consolas, monospace';
        ctx.fillText(`OSC1: SAW | OSC2: SAW | OSC3: PULSE SUB`, 14, 192);
      } else if (activeTrack.engine === 'bass303' && activeTrack.bass303Params) {
        const p = activeTrack.bass303Params;
        ctx.fillStyle = '#6ab89d';
        ctx.fillText('CUTOFF', 14, 150);
        ctx.fillText('RESO', 70, 150);
        ctx.fillText('DRIVE', 126, 150);
        ctx.fillText('ACCENT', 182, 150);

        ctx.fillStyle = '#e2f7ed';
        ctx.font = 'bold 13px Consolas, monospace';
        ctx.fillText(`${Math.round(p.cutoff * 100)}%`, 14, 170);
        ctx.fillText(`${Math.round(p.resonance * 100)}%`, 70, 170);
        ctx.fillText(`${Math.round(p.drive * 100)}%`, 126, 170);
        ctx.fillText(`${Math.round(p.accent * 100)}%`, 182, 170);

        ctx.fillStyle = '#4e7b6d';
        ctx.font = '9px Consolas, monospace';
        ctx.fillText(`WAVE: ${p.waveform === 0 ? 'SAWTOOTH' : 'SQUARE'} | DIODE LADDER`, 14, 192);
      } else if (activeTrack.engine === 'drum808' && activeTrack.drum808Params) {
        const p = activeTrack.drum808Params;
        ctx.fillStyle = '#6ab89d';
        ctx.fillText('BD DECAY', 14, 150);
        ctx.fillText('BD TUNE', 70, 150);
        ctx.fillText('SD SNAPPY', 126, 150);
        ctx.fillText('HH DECAY', 182, 150);

        ctx.fillStyle = '#e2f7ed';
        ctx.font = 'bold 13px Consolas, monospace';
        ctx.fillText(`${Math.round(p.bd_decay * 100)}%`, 14, 170);
        ctx.fillText(`${Math.round(p.bd_tune * 100)}%`, 70, 170);
        ctx.fillText(`${Math.round(p.sd_snappy * 100)}%`, 126, 170);
        ctx.fillText(`${Math.round(p.hh_decay * 100)}%`, 182, 170);

        ctx.fillStyle = '#4e7b6d';
        ctx.font = '9px Consolas, monospace';
        ctx.fillText('TR-808 ANALOG PERCUSSION RACK', 14, 192);
      } else {
        ctx.fillStyle = '#6ab89d';
        ctx.fillText('VOL', 14, 150);
        ctx.fillText('PAN', 70, 150);
        ctx.fillText('DLY SEND', 126, 150);
        ctx.fillText('REV SEND', 182, 150);

        ctx.fillStyle = '#e2f7ed';
        ctx.font = 'bold 13px Consolas, monospace';
        ctx.fillText(`${Math.round(activeTrack.volume * 100)}%`, 14, 170);
        ctx.fillText(`${Math.round(activeTrack.pan * 100)}`, 70, 170);
        ctx.fillText(`${Math.round(activeTrack.delaySend * 100)}%`, 126, 170);
        ctx.fillText(`${Math.round(activeTrack.reverbSend * 100)}%`, 182, 170);
      }

      // Step sequencer position LED dots on OLED footer
      for (let s = 0; s < 16; s++) {
        const isActive = activeTrack.steps[s]?.active;
        const isCurrent = currentStep === s;
        ctx.fillStyle = isCurrent ? '#ffffff' : isActive ? '#a9efd7' : '#1e3831';
        ctx.fillRect(10 + s * 14, 216, 10, 8);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [engine, activeTrack, currentStep, project.bpm]);

  // Note trigger helpers
  const handleNoteDown = (note: number) => {
    const shifted = note + octaveShift * 12;
    setHeldKeys((prev) => new Set(prev).add(shifted));
    engine?.triggerNoteOn(activeTrackIndex, shifted, 0.9);

    // If recording while stopped, insert step
    if (isRecording && !isPlaying) {
      const updatedSteps = [...activeTrack.steps];
      updatedSteps[currentStep] = {
        ...updatedSteps[currentStep],
        active: true,
        note: shifted,
        velocity: 110,
      };
      const updatedTracks = [...project.tracks];
      updatedTracks[activeTrackIndex] = {
        ...activeTrack,
        steps: updatedSteps,
      };
      onUpdateProject({ ...project, tracks: updatedTracks });
    }
  };

  const handleNoteUp = (note: number) => {
    const shifted = note + octaveShift * 12;
    setHeldKeys((prev) => {
      const next = new Set(prev);
      next.delete(shifted);
      return next;
    });
    engine?.triggerNoteOff(activeTrackIndex, shifted);
  };

  // Adjust parameter with knob or buttons
  const adjustParam = (index: number, delta: number) => {
    setEncoderAngles((prev) => {
      const key = index === 1 ? 'k1' : index === 2 ? 'k2' : index === 3 ? 'k3' : index === 4 ? 'k4' : 'vol';
      return { ...prev, [key]: (prev[key] + delta * 25) % 360 };
    });

    const updatedTracks = [...project.tracks];
    const track = { ...activeTrack };

    if (track.engine === 'moog' && track.moogParams) {
      const p = { ...track.moogParams };
      if (index === 1) p.cutoff = Math.max(0.02, Math.min(0.98, p.cutoff + delta));
      if (index === 2) p.resonance = Math.max(0.0, Math.min(0.95, p.resonance + delta));
      if (index === 3) p.envMod = Math.max(0.0, Math.min(1.0, p.envMod + delta));
      if (index === 4) p.glide = Math.max(0.0, Math.min(1.0, p.glide + delta));
      track.moogParams = p;
    } else if (track.engine === 'bass303' && track.bass303Params) {
      const p = { ...track.bass303Params };
      if (index === 1) p.cutoff = Math.max(0.05, Math.min(0.95, p.cutoff + delta));
      if (index === 2) p.resonance = Math.max(0.0, Math.min(0.95, p.resonance + delta));
      if (index === 3) p.drive = Math.max(0.0, Math.min(1.0, p.drive + delta));
      if (index === 4) p.accent = Math.max(0.0, Math.min(1.0, p.accent + delta));
      track.bass303Params = p;
    } else {
      if (index === 1) track.volume = Math.max(0.0, Math.min(1.0, track.volume + delta));
      if (index === 2) track.pan = Math.max(-1.0, Math.min(1.0, track.pan + delta * 2));
      if (index === 3) track.delaySend = Math.max(0.0, Math.min(1.0, track.delaySend + delta));
      if (index === 4) track.reverbSend = Math.max(0.0, Math.min(1.0, track.reverbSend + delta));
    }

    updatedTracks[activeTrackIndex] = track;
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Outer Hardware Chassis */}
      <div className="relative w-full max-w-[960px] bg-gradient-to-b from-[#353c3f] via-[#242b2d] to-[#1a2123] rounded-2xl border-2 border-[#455357] p-6 shadow-2xl shadow-black/80">
        {/* Hex Screws */}
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#4b5558] to-[#1c2224] border border-[#23292b] flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-[#66777c]"></div>
        </div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#4b5558] to-[#1c2224] border border-[#23292b] flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-[#66777c]"></div>
        </div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#4b5558] to-[#1c2224] border border-[#23292b] flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-[#66777c]"></div>
        </div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#4b5558] to-[#1c2224] border border-[#23292b] flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-[#66777c]"></div>
        </div>

        {/* Top Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-[#354347]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold tracking-widest text-[#a9efd7]">FM–1</span>
            <span className="text-[10px] font-mono tracking-widest text-[#7a8f94] bg-[#1a2427] px-2 py-0.5 rounded border border-[#304044]">
              VIRTUAL ANALOG MOOG
            </span>
          </div>
          <div className="text-[11px] font-mono tracking-widest text-[#8aa0a5]">
            8 TRACKS · 64 STEPS · MULTI-ENGINE GROOVEBOX
          </div>
        </div>

        {/* Center Panel: OLED Display & Encoders */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center">
          {/* Left Encoders / Controls */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <div className="bg-[#1b2326] p-3 rounded-xl border border-[#2e3c40]">
              <div className="text-[10px] font-mono text-[#7e969a] mb-2 uppercase">TRACK SELECT (1-8)</div>
              <div className="grid grid-cols-4 gap-1.5">
                {project.tracks.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrackIndex(idx)}
                    className={`py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                      activeTrackIndex === idx
                        ? 'bg-[#a9efd7] text-[#11241f] shadow-sm'
                        : 'bg-[#283539] text-[#9cb2b6] hover:bg-[#34464c]'
                    }`}
                  >
                    T{t.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1b2326] p-3 rounded-xl border border-[#2e3c40]">
              <div className="text-[10px] font-mono text-[#7e969a] mb-2 uppercase">ENGINE ROLE</div>
              <div className="text-xs font-mono font-semibold text-[#a9efd7] flex items-center justify-between">
                <span>{activeTrack.engine.toUpperCase()}</span>
                <span className="text-[10px] text-[#718b8f]">CH {activeTrack.midiChannel}</span>
              </div>
            </div>
          </div>

          {/* Center OLED Screen */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative p-2.5 bg-[#0e1416] rounded-xl border-2 border-[#2b3a3e] shadow-inner shadow-black/80">
              <canvas
                ref={canvasRef}
                width={240}
                height={240}
                className="w-[240px] h-[240px] rounded-lg shadow-inner bg-[#0a1012]"
              />
            </div>
          </div>

          {/* Right Encoders (K1-K4 parameter knobs) */}
          <div className="md:col-span-3 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="bg-[#1b2326] p-2.5 rounded-xl border border-[#2e3c40] flex flex-col items-center">
                <span className="text-[9px] font-mono text-[#7e969a] uppercase mb-1">K{k}</span>
                {/* Knob Rotary Dial */}
                <div
                  className="w-12 h-12 rounded-full bg-gradient-to-b from-[#414e52] to-[#252f32] border border-[#1a2123] shadow-md flex items-center justify-center relative cursor-ns-resize"
                  onWheel={(e) => {
                    e.preventDefault();
                    adjustParam(k, e.deltaY < 0 ? 0.05 : -0.05);
                  }}
                >
                  <div
                    className="w-1 h-4 bg-[#a9efd7] rounded-full absolute top-1"
                    style={{
                      transformOrigin: '50% 20px',
                      transform: `rotate(${k === 1 ? encoderAngles.k1 : k === 2 ? encoderAngles.k2 : k === 3 ? encoderAngles.k3 : encoderAngles.k4}deg)`,
                    }}
                  />
                </div>
                {/* Detents Adjuster */}
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => adjustParam(k, -0.05)}
                    className="w-6 h-5 rounded bg-[#273438] hover:bg-[#34454a] text-xs font-mono text-[#a9efd7] flex items-center justify-center border border-[#394a50]"
                  >
                    -
                  </button>
                  <button
                    onClick={() => adjustParam(k, 0.05)}
                    className="w-6 h-5 rounded bg-[#273438] hover:bg-[#34454a] text-xs font-mono text-[#a9efd7] flex items-center justify-center border border-[#394a50]"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transport & Function Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#182124] rounded-xl border border-[#2c3a3e] mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (engine) {
                  const playing = engine.togglePlay();
                  setIsPlaying(playing);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-md ${
                isPlaying
                  ? 'bg-[#1b3e34] text-[#a9efd7] border border-[#4ea282]'
                  : 'bg-[#a9efd7] text-[#11241f] hover:bg-[#c4f8e5]'
              }`}
            >
              {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'STOP' : 'PLAY'}
            </button>

            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs font-semibold border transition-all ${
                isRecording
                  ? 'bg-[#4a1c17] text-[#ff8e82] border-[#b03d32] shadow-sm'
                  : 'bg-[#242f33] text-[#a7bcc0] border-[#36484e] hover:bg-[#303f44]'
              }`}
            >
              <Circle className={`w-3.5 h-3.5 ${isRecording ? 'fill-current text-[#ff5f50]' : ''}`} />
              REC
            </button>

            <button
              onClick={() => engine?.panic()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs text-[#d1a478] bg-[#29221b] border border-[#524031] hover:bg-[#3b2f25]"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              PANIC
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#12191b] px-2 py-1 rounded-lg border border-[#2b3a3e]">
              <span className="text-[10px] font-mono text-[#7b9397] mr-1">OCT:</span>
              <button
                onClick={() => setOctaveShift((prev) => Math.max(-2, prev - 1))}
                className="w-5 h-5 rounded bg-[#253236] text-xs font-mono text-[#a9efd7] flex items-center justify-center hover:bg-[#34464c]"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-[#e1ecea] px-1.5">
                {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}
              </span>
              <button
                onClick={() => setOctaveShift((prev) => Math.min(2, prev + 1))}
                className="w-5 h-5 rounded bg-[#253236] text-xs font-mono text-[#a9efd7] flex items-center justify-center hover:bg-[#34464c]"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#7b9397]">TEMPO:</span>
              <input
                type="number"
                min="30"
                max="300"
                value={project.bpm}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 120;
                  onUpdateProject({ ...project, bpm: val });
                }}
                className="w-16 bg-[#12191b] text-xs font-mono text-[#a9efd7] font-bold px-2 py-1 rounded border border-[#2e3e42]"
              />
            </div>
          </div>
        </div>

        {/* 27-Key Micro Keyboard (exact hardware layout) */}
        <div className="relative w-full h-32 bg-gradient-to-b from-[#131b1e] to-[#182326] rounded-xl border border-[#2f3e42] p-2 overflow-hidden shadow-inner select-none">
          {/* Piano Keys Strip */}
          <div className="relative w-full h-full flex">
            {PIANO_KEYS.map((k) => {
              const shifted = k.note + octaveShift * 12;
              const isHeld = heldKeys.has(shifted);

              return (
                <button
                  key={k.note}
                  onMouseDown={() => handleNoteDown(k.note)}
                  onMouseUp={() => handleNoteUp(k.note)}
                  onMouseLeave={() => {
                    if (heldKeys.has(shifted)) handleNoteUp(k.note);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleNoteDown(k.note);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleNoteUp(k.note);
                  }}
                  className={`relative flex-1 rounded-b-md transition-all ${
                    k.black
                      ? `h-[60%] -mx-2 z-10 ${
                          isHeld
                            ? 'bg-[#3b594e] border-t-2 border-[#a9efd7] shadow-lg'
                            : 'bg-gradient-to-b from-[#212b2e] to-[#141a1c] border-b-2 border-[#0c1011]'
                        }`
                      : `h-full ${
                          isHeld
                            ? 'bg-[#4b7163] border-t-2 border-[#a9efd7] shadow-lg text-[#e6fbf2]'
                            : 'bg-gradient-to-b from-[#38464a] to-[#252f32] border-b-2 border-[#161c1e] text-[#8aa0a5]'
                        }`
                  } border-l border-r border-[#1a2225] flex flex-col items-center justify-end pb-1.5`}
                >
                  {/* Lit Indicator LED strip on key */}
                  <div
                    className={`w-1 h-3 rounded-full mb-1 ${
                      isHeld ? 'bg-[#a9efd7] shadow-[0_0_8px_#a9efd7]' : 'bg-[#293639]'
                    }`}
                  />
                  <span className="text-[8px] font-mono opacity-80">{k.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Hardware Info */}
        <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-[#6a8085]">
          <span>M-VAVE OPEN ARCHITECTURE</span>
          <span>POLY D / MINIMOOG C-ENGINE INTEGRATED</span>
          <span>WEB AUDIO DSP 44.1 KHZ</span>
        </div>
      </div>
    </div>
  );
};
