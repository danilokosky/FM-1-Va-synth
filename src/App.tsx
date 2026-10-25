import React, { useState, useEffect, useRef } from 'react';
import { initialProject } from './data/defaultProject';
import { ProjectData } from './types/synth';
import { AudioEngine } from './audio/AudioEngine';
import { HardwareFaceplate } from './components/HardwareFaceplate';
import { MoogStudioView } from './components/MoogStudioView';
import { SequencerMatrix } from './components/SequencerMatrix';
import { MultiEngineLab } from './components/MultiEngineLab';
import { ProjectManager } from './components/ProjectManager';
import { Play, Square, Sliders, Activity, Music, Zap, Save, HelpCircle } from 'lucide-react';

type StudioMode = 'hardware' | 'moog' | 'sequencer' | 'lab' | 'project';

// Keyboard key mapping (A=C4, W=C#4, S=D4, etc.)
const KEY_MAP: Record<string, number> = {
  a: 60, // C4
  w: 61, // C#4
  s: 62, // D4
  e: 63, // D#4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4
  g: 67, // G4
  y: 68, // G#4
  h: 69, // A4
  u: 70, // A#4
  j: 71, // B4
  k: 72, // C5
  o: 73, // C#5
  l: 74, // D5
  p: 75, // D#5
  ';': 76, // E5
};

export const App: React.FC = () => {
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [currentMode, setCurrentMode] = useState<StudioMode>('hardware');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  const engineRef = useRef<AudioEngine | null>(null);

  // Initialize AudioEngine on first mount
  useEffect(() => {
    const eng = new AudioEngine(project);
    eng.onStep((step) => {
      setCurrentStep(step);
    });
    engineRef.current = eng;

    return () => {
      eng.stop();
    };
  }, []);

  // Update audio engine whenever project changes
  const handleUpdateProject = (newProject: ProjectData) => {
    setProject(newProject);
    if (engineRef.current) {
      engineRef.current.setProject(newProject);
    }
  };

  // Computer keyboard hotkeys for playing notes & transport
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (engineRef.current) {
          const playing = engineRef.current.togglePlay();
          setIsPlaying(playing);
          setAudioStarted(true);
        }
        return;
      }

      const note = KEY_MAP[e.key.toLowerCase()];
      if (note !== undefined && !e.repeat && engineRef.current) {
        setAudioStarted(true);
        engineRef.current.triggerNoteOn(activeTrackIndex, note, 0.9);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const note = KEY_MAP[e.key.toLowerCase()];
      if (note !== undefined && engineRef.current) {
        engineRef.current.triggerNoteOff(activeTrackIndex, note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTrackIndex]);

  const togglePlay = async () => {
    if (!engineRef.current) return;
    setAudioStarted(true);
    const playing = engineRef.current.togglePlay();
    setIsPlaying(playing);
  };

  return (
    <div className="min-h-screen bg-[#11171a] text-[#e0e8eb] flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-[#151f22]/95 backdrop-blur border-b border-[#293a3f] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#a9efd7] text-[#12221e]">
            <svg viewBox="0 0 32 32" className="w-5 h-5 fill-none stroke-current stroke-2">
              <path d="M4 16h4l3-9 5 18 5-18 3 9h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold text-[#eef6f3] tracking-wide">
                FM–1 <span className="text-[#a9efd7]">WORKBENCH</span>
              </h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#203330] text-[#a9efd7] border border-[#3b5e52]">
                MOOG VA EDITION
              </span>
            </div>
            <p className="text-[10px] text-[#789096] font-mono">
              Virtual Analog · 8 Tracks · Step Sequencer · 44.1kHz DSP
            </p>
          </div>
        </div>

        {/* Studio View Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#101719] p-1 rounded-xl border border-[#253539]">
          {[
            { id: 'hardware', label: 'HARDWARE PANEL', icon: Sliders },
            { id: 'moog', label: 'MOOG VA STUDIO', icon: Activity },
            { id: 'sequencer', label: '8-TRACK SEQUENCER', icon: Music },
            { id: 'lab', label: 'SOUND LAB (303/808/DX7)', icon: Zap },
            { id: 'project', label: 'PROJECT & FX', icon: Save },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = currentMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentMode(tab.id as StudioMode)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  active
                    ? 'bg-[#a9efd7] text-[#122420] shadow-sm'
                    : 'text-[#879ea3] hover:text-[#e4eff1] hover:bg-[#1a2529]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Transport Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-[#1e4539] text-[#a9efd7] border border-[#53ad8b]'
                : 'bg-[#a9efd7] text-[#122520] hover:bg-[#c6fae8]'
            }`}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>

          <div className="flex items-center gap-1.5 bg-[#12191b] px-3 py-1.5 rounded-lg border border-[#293a3f]">
            <span className="text-[10px] font-mono text-[#789196]">BPM</span>
            <span className="text-xs font-mono font-bold text-[#a9efd7]">{project.bpm}</span>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 p-4 md:p-6 max-w-[1360px] w-full mx-auto">
        {!audioStarted && (
          <div className="mb-4 p-3 bg-[#1c2c28] border border-[#446d5f] rounded-xl flex items-center justify-between gap-4 text-xs font-mono text-[#c3ecd9]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a9efd7] animate-ping" />
              <span>Click Play or press any key (A-K or Spacebar) to enable audio synthesis!</span>
            </div>
            <button
              onClick={() => {
                engineRef.current?.startAudioContext();
                setAudioStarted(true);
              }}
              className="px-3 py-1 bg-[#a9efd7] text-[#122420] font-bold rounded-md hover:bg-[#d5faec]"
            >
              ENABLE AUDIO
            </button>
          </div>
        )}

        {/* Active View Component */}
        {currentMode === 'hardware' && (
          <HardwareFaceplate
            project={project}
            engine={engineRef.current}
            activeTrackIndex={activeTrackIndex}
            setActiveTrackIndex={setActiveTrackIndex}
            onUpdateProject={handleUpdateProject}
            currentStep={currentStep}
          />
        )}

        {currentMode === 'moog' && (
          <MoogStudioView
            project={project}
            activeTrackIndex={activeTrackIndex}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {currentMode === 'sequencer' && (
          <SequencerMatrix
            project={project}
            activeTrackIndex={activeTrackIndex}
            setActiveTrackIndex={setActiveTrackIndex}
            onUpdateProject={handleUpdateProject}
            currentStep={currentStep}
          />
        )}

        {currentMode === 'lab' && (
          <MultiEngineLab
            project={project}
            engine={engineRef.current}
            activeTrackIndex={activeTrackIndex}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {currentMode === 'project' && (
          <ProjectManager
            project={project}
            engine={engineRef.current}
            onUpdateProject={handleUpdateProject}
          />
        )}
      </main>

      {/* Keyboard Helper Banner */}
      <footer className="border-t border-[#223136] bg-[#12191c] px-6 py-2.5 text-[11px] font-mono text-[#718b91] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>KEYBOARD PLAY:</span>
          <span className="bg-[#1c282c] px-1.5 py-0.5 rounded text-[#a9efd7] border border-[#2d3e44]">A-W-S-E-D-F-G-H-J-K-L</span>
          <span>SPACE: Play/Stop</span>
        </div>
        <div>
          <span>M-VAVE FM1 · Minimoog / Poly D Virtual Analog Engine</span>
        </div>
      </footer>
    </div>
  );
};
export default App;
