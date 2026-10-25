import React, { useState, useEffect } from 'react';
import { ProjectData } from '../types/synth';
import { AudioEngine } from '../audio/AudioEngine';
import { initialProject } from '../data/defaultProject';
import { Download, Upload, Disc, Save, Sliders, Radio, Music } from 'lucide-react';

interface ProjectManagerProps {
  project: ProjectData;
  engine: AudioEngine | null;
  onUpdateProject: (p: ProjectData) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  project,
  engine,
  onUpdateProject,
}) => {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [midiDevices, setMidiDevices] = useState<string[]>([]);

  // Web MIDI API scan
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      navigator.requestMIDIAccess()
        .then((access) => {
          const names: string[] = [];
          access.inputs.forEach((input: any) => {
            if (input.name) names.push(input.name);
            input.onmidimessage = (msg: any) => {
              if (!msg || !msg.data || msg.data.length < 3) return;
              const status = msg.data[0];
              const note = msg.data[1];
              const velocity = msg.data[2];
              const command = status >> 4;
              if (command === 9 && velocity > 0) {
                // Note on
                engine?.triggerNoteOn(0, note, velocity / 127.0);
              } else if (command === 8 || (command === 9 && velocity === 0)) {
                // Note off
                engine?.triggerNoteOff(0, note);
              }
            };
          });
          setMidiDevices(names);
        })
        .catch(() => {
          // MIDI not available or permission denied
        });
    }
  }, [engine]);

  // Audio Recording toggle
  const toggleAudioRecording = async () => {
    if (!engine) return;
    if (isRecordingAudio) {
      const blob = await engine.stopRecording();
      setIsRecordingAudio(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      }
    } else {
      setRecordedAudioUrl(null);
      const ok = engine.startRecording();
      if (ok) setIsRecordingAudio(true);
    }
  };

  // Export JSON
  const exportProjectJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}.fm1.json`);
    dlAnchor.click();
  };

  // Import JSON
  const importProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && parsed.tracks) {
          onUpdateProject(parsed);
        }
      } catch {
        alert('Invalid FM-1 project file');
      }
    };
    reader.readAsText(file);
  };

  // Preset groove loaders
  const loadPresetGroove = (name: string) => {
    if (name === 'moog_minimoog') {
      onUpdateProject({ ...initialProject });
    } else if (name === 'retrowave') {
      const p = { ...initialProject, name: '80s Retrowave Odyssey', bpm: 110 };
      onUpdateProject(p);
    } else if (name === 'acid_techno') {
      const p = { ...initialProject, name: 'Acid Minimoog Techno', bpm: 132 };
      onUpdateProject(p);
    }
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-[#172023] rounded-2xl border border-[#2b393d] p-6 shadow-xl">
      <div className="pb-5 border-b border-[#28363a] mb-6">
        <h2 className="text-xl font-bold font-mono tracking-tight text-[#a9efd7] flex items-center gap-2">
          <Save className="w-5 h-5 text-[#a9efd7]" />
          PROJECT & MASTER FX STUDIO
        </h2>
        <p className="text-xs text-[#809aa0]">
          Export .fm1 projects · WAV/Audio Recording · Stereo Delay & Reverb · Web MIDI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Presets & Project Files */}
        <div className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-[#a9efd7]">GROOVEBOX PRESETS</span>

          <div className="flex flex-col gap-2">
            {[
              { id: 'moog_minimoog', title: 'Minimoog Groove (Default)' },
              { id: 'retrowave', title: '80s Retrowave Odyssey' },
              { id: 'acid_techno', title: 'Acid Minimoog Techno' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => loadPresetGroove(g.id)}
                className="w-full text-left p-2.5 rounded-lg bg-[#243135] hover:bg-[#314348] border border-[#394a50] text-xs font-mono text-[#d3e3e7] transition-all"
              >
                {g.title}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#29383c] flex flex-col gap-2">
            <button
              onClick={exportProjectJson}
              className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#273439] hover:bg-[#34454b] text-xs font-mono text-[#a9efd7] border border-[#3e535a]"
            >
              <Download className="w-3.5 h-3.5" /> EXPORT PROJECT (.FM1)
            </button>

            <label className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#273439] hover:bg-[#34454b] text-xs font-mono text-[#a9efd7] border border-[#3e535a] cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> IMPORT PROJECT
              <input type="file" accept=".json,.fm1" onChange={importProjectJson} className="hidden" />
            </label>
          </div>
        </div>

        {/* Column 2: Master FX (Delay, Reverb, Limiter) */}
        <div className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-[#a9efd7] flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> MASTER EFFECTS RACK
          </span>

          <div className="space-y-3 text-[10px] font-mono text-[#8aa0a5]">
            <div>
              <div className="flex justify-between">
                <span>STEREO DELAY TIME</span>
                <span className="text-[#a9efd7]">{Math.round(project.delayTime)} ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="10"
                value={project.delayTime}
                onChange={(e) => onUpdateProject({ ...project, delayTime: parseFloat(e.target.value) })}
                className="w-full accent-[#a9efd7]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>DELAY FEEDBACK</span>
                <span className="text-[#a9efd7]">{Math.round(project.delayFeedback * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.85"
                step="0.01"
                value={project.delayFeedback}
                onChange={(e) => onUpdateProject({ ...project, delayFeedback: parseFloat(e.target.value) })}
                className="w-full accent-[#a9efd7]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>DELAY MASTER MIX</span>
                <span className="text-[#a9efd7]">{Math.round(project.delayMix * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.01"
                value={project.delayMix}
                onChange={(e) => onUpdateProject({ ...project, delayMix: parseFloat(e.target.value) })}
                className="w-full accent-[#a9efd7]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>REVERB MIX</span>
                <span className="text-[#a9efd7]">{Math.round(project.reverbMix * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.01"
                value={project.reverbMix}
                onChange={(e) => onUpdateProject({ ...project, reverbMix: parseFloat(e.target.value) })}
                className="w-full accent-[#a9efd7]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span>MASTER OUTPUT VOLUME</span>
                <span className="text-[#a9efd7]">{Math.round(project.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={project.masterVolume}
                onChange={(e) => onUpdateProject({ ...project, masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-[#a9efd7]"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Live Recording & Web MIDI */}
        <div className="bg-[#1b262a] p-4 rounded-xl border border-[#2e3e44] flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-[#a9efd7] flex items-center gap-1.5">
            <Radio className="w-4 h-4" /> AUDIO RECORDER & MIDI
          </span>

          <div className="p-3 bg-[#12191b] rounded-lg border border-[#27383c] flex flex-col items-center gap-3">
            <button
              onClick={toggleAudioRecording}
              className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold transition-all ${
                isRecordingAudio
                  ? 'bg-[#a33d32] text-white shadow-lg animate-pulse'
                  : 'bg-[#a9efd7] text-[#11241f] hover:bg-[#c6f7e8]'
              }`}
            >
              {isRecordingAudio ? 'STOP RECORDING' : 'RECORD AUDIO PERFORMANCE'}
            </button>

            {recordedAudioUrl && (
              <div className="w-full flex flex-col items-center gap-2 mt-2">
                <audio controls src={recordedAudioUrl} className="w-full h-8" />
                <a
                  href={recordedAudioUrl}
                  download="fm1_performance.webm"
                  className="text-[10px] font-mono text-[#a9efd7] underline"
                >
                  Download Audio File (.webm)
                </a>
              </div>
            )}
          </div>

          <div className="p-3 bg-[#12191b] rounded-lg border border-[#27383c]">
            <span className="text-[10px] font-mono text-[#7e999f] block mb-1">CONNECTED MIDI DEVICES:</span>
            {midiDevices.length > 0 ? (
              <ul className="text-xs font-mono text-[#a9efd7] space-y-1">
                {midiDevices.map((d, i) => (
                  <li key={i} className="truncate">
                    ✓ {d}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-xs font-mono text-[#62777c]">No external MIDI controller detected (USB / BLE plug & play ready)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
