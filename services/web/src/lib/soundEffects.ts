/**
 * Web Audio API Industrial Sound Synthesizer
 * Generates real-time acoustic feedback for machine degradation,
 * electrical sensor noise spikes, industrial alert pings, and work order approvals.
 */

class IndustrialSoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plantpulse_sound_muted");
      this.isMuted = saved === "true";
      this.initUnlock();
    }
  }

  public initUnlock() {
    if (typeof window === "undefined") return;
    const unlock = () => {
      this.getAudioContext();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("plantpulse_sound_muted", String(this.isMuted));
    }
    if (!this.isMuted) {
      this.playAlertPing();
    }
    return this.isMuted;
  }

  /**
   * Synthesize Electrical Sensor Noise (1-tick spark / static crackle glitch)
   */
  public playSensorNoise() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.42;

      // 1. 60Hz AC electrical hum buzz burst
      const buzz = ctx.createOscillator();
      buzz.type = "sawtooth";
      buzz.frequency.setValueAtTime(60, now);
      buzz.frequency.exponentialRampToValueAtTime(120, now + duration);

      const buzzFilter = ctx.createBiquadFilter();
      buzzFilter.type = "lowpass";
      buzzFilter.frequency.setValueAtTime(280, now);

      const buzzGain = ctx.createGain();
      buzzGain.gain.setValueAtTime(0.35, now);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      buzz.connect(buzzFilter);
      buzzFilter.connect(buzzGain);
      buzzGain.connect(ctx.destination);

      buzz.start(now);
      buzz.stop(now + duration);

      // 2. High frequency electrical static crackle / spark discharge
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const spike = Math.random() > 0.94 ? (Math.random() * 2 - 1) * 3.5 : 0;
        data[i] = (white * 0.5 + spike) * Math.exp(-2.5 * (i / bufferSize));
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(2800, now);
      noiseFilter.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration);
    } catch (e) {
      console.warn("Could not play sensor noise audio:", e);
    }
  }

  /**
   * Synthesize Bearing Failure Degradation (Mechanical grinding rumble & vibration jitter)
   */
  public playBearingFailure() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 1.8;

      // 1. Low frequency motor rumbling (Sawtooth)
      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(85, now);
      osc1.frequency.linearRampToValueAtTime(155, now + duration);

      // Modulation LFO for rumble flutter
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(16, now); // 16Hz bearing wobble
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(40, now);
      lfo.connect(osc1.frequency);

      // 2. Friction noise buffer for metallic grinding
      const bufferSize = ctx.sampleRate * duration;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(650, now);
      noiseFilter.frequency.linearRampToValueAtTime(1100, now + duration);
      noiseFilter.Q.setValueAtTime(2.0, now);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, now);
      masterGain.gain.linearRampToValueAtTime(0.45, now + 0.3);
      masterGain.gain.linearRampToValueAtTime(0.5, now + 1.2);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc1.connect(masterGain);
      noiseNode.connect(noiseFilter);
      noiseFilter.connect(masterGain);
      masterGain.connect(ctx.destination);

      lfo.start(now);
      osc1.start(now);
      noiseNode.start(now);

      lfo.stop(now + duration);
      osc1.stop(now + duration);
      noiseNode.stop(now + duration);
    } catch (e) {
      console.warn("Could not play bearing failure audio:", e);
    }
  }

  /**
   * Synthesize Warning Ping for Anomaly Breach
   */
  public playAlertPing() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.18); // E5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn("Could not play alert ping:", e);
    }
  }

  /**
   * Synthesize Approval Confirmation Chord (C5 -> E5 -> G5)
   */
  public playApprovalChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 triad

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch (e) {
      console.warn("Could not play approval chime:", e);
    }
  }

  /**
   * Synthesize Mechanical Reset / Normalization Sweep
   */
  public playResetSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.45);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("Could not play reset sound:", e);
    }
  }
}

export const soundEngine = new IndustrialSoundEngine();
