import { ProjectData, TrackData, StepData } from '../types/synth';
import { MoogVoice } from './MoogVoice';
import { Bass303Voice } from './Bass303Voice';
import { Drum808Synth } from './Drum808Synth';
import { DX7Voice } from './DX7Voice';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private masterGain: GainNode | null = null;

  // Sound Engine Voices
  private moogVoices: MoogVoice[] = [];
  private bass303Voices: Bass303Voice[] = [];
  private drumSynth: Drum808Synth | null = null;
  private dx7Voices: DX7Voice[] = [];

  // Project state
  private project: ProjectData;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private stepCallback?: (step: number) => void;

  // Clock / Timing
  private nextStepTime: number = 0;
  private timerId: number | null = null;

  // Stereo Delay Buffer
  private delayBufferL: Float32Array = new Float32Array(44100 * 2);
  private delayBufferR: Float32Array = new Float32Array(44100 * 2);
  private delayWriteIdx: number = 0;

  // Simple Reverb Buffer
  private revBufferL: Float32Array = new Float32Array(44100 * 2);
  private revBufferR: Float32Array = new Float32Array(44100 * 2);
  private revWriteIdx: number = 0;

  // MediaRecorder for export
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor(project: ProjectData) {
    this.project = project;
  }

  public async init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx({ latencyHint: 'interactive' });

    const sampleRate = this.ctx.sampleRate;

    // Initialize voice pools
    this.moogVoices = Array.from({ length: 8 }, () => new MoogVoice(sampleRate));
    this.bass303Voices = Array.from({ length: 4 }, () => new Bass303Voice(sampleRate));
    this.drumSynth = new Drum808Synth(sampleRate);
    this.dx7Voices = Array.from({ length: 6 }, () => new DX7Voice(sampleRate));

    // Analyser Node for LCD visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Master Gain & Limiter
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.project.masterVolume;

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 10;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    // ScriptProcessor for exact sample-accurate DSP synthesis
    const bufferSize = 512;
    this.scriptNode = this.ctx.createScriptProcessor(bufferSize, 0, 2);
    this.scriptNode.onaudioprocess = (e) => this.processAudio(e);

    this.scriptNode.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(compressor);
    compressor.connect(this.ctx.destination);
  }

  public setProject(project: ProjectData) {
    this.project = project;
    if (this.masterGain) {
      this.masterGain.gain.value = project.masterVolume;
    }
  }

  public getProject(): ProjectData {
    return this.project;
  }

  public onStep(cb: (step: number) => void) {
    this.stepCallback = cb;
  }

  public async startAudioContext() {
    if (!this.ctx) {
      await this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // --- Real-time Instrument Note Triggers ---
  public triggerNoteOn(trackIndex: number, note: number, velocity: number = 0.8, slide: boolean = false, accent: boolean = false) {
    this.startAudioContext();
    const track = this.project.tracks[trackIndex];
    if (!track || track.role === 'OFF') return;

    if (track.engine === 'moog' && track.moogParams) {
      // Find free voice or steal oldest
      let voice = this.moogVoices.find((v) => v.isFree());
      if (!voice) voice = this.moogVoices[0];
      voice.noteOn(note, velocity, track.moogParams, slide);
    } else if (track.engine === 'bass303' && track.bass303Params) {
      let voice = this.bass303Voices.find((v) => v.isFree());
      if (!voice) voice = this.bass303Voices[0];
      voice.noteOn(note, velocity, track.bass303Params, slide, accent);
    } else if (track.engine === 'drum808' && track.drum808Params) {
      // Note mapping for drums
      let drumType = 'BD';
      if (note === 36 || note === 35) drumType = 'BD';
      else if (note === 38 || note === 40) drumType = 'SD';
      else if (note === 42 || note === 44) drumType = 'CH';
      else if (note === 46) drumType = 'OH';
      else if (note === 39) drumType = 'CP';
      else if (note === 41 || note === 43) drumType = 'LT';
      else if (note === 45 || note === 47) drumType = 'MT';
      else if (note === 48 || note === 50) drumType = 'HT';
      else if (note === 56) drumType = 'CB';
      this.drumSynth?.trigger(drumType, velocity, track.drum808Params);
    } else if (track.engine === 'dx7' && track.dx7Params) {
      let voice = this.dx7Voices.find((v) => v.isFree());
      if (!voice) voice = this.dx7Voices[0];
      voice.noteOn(note, velocity);
    }
  }

  public triggerNoteOff(trackIndex: number, note: number) {
    const track = this.project.tracks[trackIndex];
    if (!track) return;

    if (track.engine === 'moog') {
      this.moogVoices.filter((v) => v.getNote() === note).forEach((v) => v.noteOff());
    } else if (track.engine === 'bass303') {
      this.bass303Voices.filter((v) => v.getNote() === note).forEach((v) => v.noteOff());
    } else if (track.engine === 'dx7') {
      this.dx7Voices.filter((v) => v.getNote() === note).forEach((v) => v.noteOff());
    }
  }

  public panic() {
    this.moogVoices.forEach((v) => v.noteOff());
    this.bass303Voices.forEach((v) => v.noteOff());
    this.dx7Voices.forEach((v) => v.noteOff());
  }

  // --- Sequencer Playback ---
  public async play() {
    await this.startAudioContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx ? this.ctx.currentTime : 0;
    this.scheduleLoop();
  }

  public stop() {
    this.isPlaying = false;
    this.panic();
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  private scheduleLoop = () => {
    if (!this.isPlaying || !this.ctx) return;

    const lookAheadTime = 0.1; // 100ms
    const secondsPerBeat = 60.0 / this.project.bpm;
    const secondsPerStep = secondsPerBeat / 4.0; // 16th notes

    while (this.nextStepTime < this.ctx.currentTime + lookAheadTime) {
      // Calculate swing offset for odd steps
      let stepTime = this.nextStepTime;
      const isOdd = this.currentStep % 2 === 1;
      if (isOdd && this.project.swing > 0) {
        stepTime += (this.project.swing / 100.0) * (secondsPerStep * 0.5);
      }

      this.triggerStep(this.currentStep, stepTime);

      this.nextStepTime += secondsPerStep;
      this.currentStep = (this.currentStep + 1) % this.project.stepCount;
      if (this.stepCallback) {
        this.stepCallback(this.currentStep);
      }
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 25);
  };

  private triggerStep(stepIndex: number, _time: number) {
    const hasSolo = this.project.tracks.some((t) => t.solo);

    this.project.tracks.forEach((track, tIdx) => {
      if (track.mute || (hasSolo && !track.solo)) return;
      if (track.role === 'OFF') return;

      const step = track.steps[stepIndex];
      if (step && step.active) {
        this.triggerNoteOn(tIdx, step.note, step.velocity / 127.0, !!step.slide, !!step.accent);

        // Schedule note off after gate duration
        const secondsPerBeat = 60.0 / this.project.bpm;
        const gateDuration = (secondsPerBeat / 4.0) * (step.gate || 0.7);
        setTimeout(() => {
          this.triggerNoteOff(tIdx, step.note);
        }, gateDuration * 1000);
      }
    });
  }

  // --- Real-time DSP Buffer Processing ---
  private processAudio(e: AudioProcessingEvent) {
    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);
    const numSamples = outL.length;
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;

    // Delay parameters
    const delaySamples = Math.floor((this.project.delayTime / 1000.0) * sampleRate);
    const delayMax = this.delayBufferL.length;
    const delayFb = this.project.delayFeedback;
    const delayMix = this.project.delayMix;

    const hasSolo = this.project.tracks.some((t) => t.solo);

    for (let s = 0; s < numSamples; s++) {
      let dryL = 0;
      let dryR = 0;
      let sendDelay = 0;
      let sendReverb = 0;

      // Track 1-8 synthesis
      for (let t = 0; t < this.project.tracks.length; t++) {
        const track = this.project.tracks[t];
        if (track.mute || (hasSolo && !track.solo)) continue;

        let trackSample = 0;
        if (track.engine === 'moog' && track.moogParams) {
          for (let v = 0; v < this.moogVoices.length; v++) {
            trackSample += this.moogVoices[v].processSample(track.moogParams);
          }
        } else if (track.engine === 'bass303' && track.bass303Params) {
          for (let v = 0; v < this.bass303Voices.length; v++) {
            trackSample += this.bass303Voices[v].processSample(track.bass303Params);
          }
        } else if (track.engine === 'drum808' && track.drum808Params && this.drumSynth) {
          trackSample += this.drumSynth.processSample(track.drum808Params);
        } else if (track.engine === 'dx7' && track.dx7Params) {
          for (let v = 0; v < this.dx7Voices.length; v++) {
            trackSample += this.dx7Voices[v].processSample(track.dx7Params);
          }
        }

        const vol = track.volume;
        const pan = track.pan; // -1 to 1
        const leftGain = Math.cos(((pan + 1.0) * Math.PI) / 4.0) * vol;
        const rightGain = Math.sin(((pan + 1.0) * Math.PI) / 4.0) * vol;

        dryL += trackSample * leftGain;
        dryR += trackSample * rightGain;

        sendDelay += trackSample * track.delaySend * vol;
        sendReverb += trackSample * track.reverbSend * vol;
      }

      // Stereo Delay Line
      const readIdx = (this.delayWriteIdx - delaySamples + delayMax) % delayMax;
      const dL = this.delayBufferL[readIdx];
      const dR = this.delayBufferR[readIdx];

      this.delayBufferL[this.delayWriteIdx] = sendDelay + dR * delayFb * 0.95;
      this.delayBufferR[this.delayWriteIdx] = sendDelay + dL * delayFb * 0.95;
      this.delayWriteIdx = (this.delayWriteIdx + 1) % delayMax;

      // Reverb Comb / Allpass Tank
      const revSamples = Math.floor(0.08 * sampleRate);
      const revReadIdx = (this.revWriteIdx - revSamples + this.revBufferL.length) % this.revBufferL.length;
      const rL = this.revBufferL[revReadIdx] * 0.7;
      const rR = this.revBufferR[revReadIdx] * 0.7;
      this.revBufferL[this.revWriteIdx] = sendReverb + rR * 0.45;
      this.revBufferR[this.revWriteIdx] = sendReverb + rL * 0.45;
      this.revWriteIdx = (this.revWriteIdx + 1) % this.revBufferL.length;

      // Master output mix
      outL[s] = dryL + dL * delayMix + rL * this.project.reverbMix;
      outR[s] = dryR + dR * delayMix + rR * this.project.reverbMix;
    }
  }

  // Visualizer / Analyser Helpers
  public getWaveformData(dataArray: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(dataArray as any);
    }
  }

  public getFrequencyData(dataArray: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(dataArray as any);
    }
  }

  // Audio Recording (WAV / WebM export)
  public startRecording(): boolean {
    if (!this.ctx || !this.masterGain) return false;
    try {
      const dest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(dest);
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(dest.stream);
      this.mediaRecorder.ondataavailable = (evt) => {
        if (evt.data.size > 0) {
          this.recordedChunks.push(evt.data);
        }
      };
      this.mediaRecorder.start();
      return true;
    } catch {
      return false;
    }
  }

  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }
}
