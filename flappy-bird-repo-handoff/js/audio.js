// Synthesized sound for Flappy — gentle, mutable cues via the Web Audio API.
// Nothing is loaded from disk. Structure mirrors the shared audio.js pattern
// used across the Playground games (see block-grid-kids/web/js/audio.js).

const CUES = {
  flap: { notes: [[520, 0.06]], volume: 0.3 },
  score: { notes: [[659.25, 0.06], [880, 0.09]], volume: 0.42 },
  button: { notes: [[880, 0.05]], volume: 0.35 },
  // Soft, friendly — NOT alarming. A gentle little dip, not a harsh buzzer.
  bump: { notes: [[392, 0.16], [329.63, 0.2]], volume: 0.4 },
};

class SoundPlayer {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.primed = false;
  }

  // Must be called from a user gesture to satisfy autoplay policies.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    // iOS requires an audio node to actually START inside the user gesture —
    // resume() alone leaves the context silent until a node starts within a
    // gesture. Priming a silent buffer here fully unlocks audio on the very
    // first gameplay tap.
    if (!this.primed) {
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.primed = true;
      } catch (e) { /* ignore — best-effort priming */ }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(name) {
    if (!this.settings.isSoundEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const cue = CUES[name];
    if (!cue) return;
    let when = this.ctx.currentTime;
    for (const [freq, duration] of cue.notes) {
      this.scheduleNote(freq, duration, when, cue.volume);
      when += duration;
    }
  }

  // A sine plus a quiet octave, shaped by a short attack and a decay tail.
  scheduleNote(freq, duration, startTime, volume) {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const attack = 0.006;
    const peak = volume * 0.85;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + Math.min(attack, duration));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const fundamental = ctx.createOscillator();
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(freq, startTime);

    const octave = ctx.createOscillator();
    octave.type = 'sine';
    octave.frequency.setValueAtTime(freq * 2, startTime);
    const octaveGain = ctx.createGain();
    octaveGain.gain.setValueAtTime(0.28 / 1.28, startTime);
    fundamental.connect(gain);
    octave.connect(octaveGain).connect(gain);

    fundamental.start(startTime);
    octave.start(startTime);
    fundamental.stop(startTime + duration + 0.02);
    octave.stop(startTime + duration + 0.02);
  }
}

// Light haptic feedback via the Vibration API (Android/Chrome; iOS ignores it).
class Haptics {
  constructor(settings) {
    this.settings = settings;
  }
  vibrate(pattern) {
    if (!this.settings.areHapticsEnabled) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }
  flap() { this.vibrate(8); }
  score() { this.vibrate(14); }
  bump() { this.vibrate([0, 16, 30, 16]); }
}

export { SoundPlayer, Haptics };
