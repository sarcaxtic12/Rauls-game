(function () {
  const FR = (window.FornoRush = window.FornoRush || {});

  // Calm, tactile ASMR-inspired culinary soundscape (zero harsh arcade buzzers!)
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.sfxEnabled = true;
      this.musicEnabled = true;
      this.musicTimer = null;
      this.musicStep = 0;
      this.feverMode = false;
      this.lastSwirlTime = 0;
      this.lastBurnWarn = 0;
      this.noiseBuffer = null;
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    createNoiseBuffer(ctx) {
      const length = Math.floor(ctx.sampleRate * 0.5);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      // Pink-ish warm filtered noise (far softer than harsh white noise)
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.06 * white) / 1.06;
        lastOut = data[i];
        data[i] *= 2.8;
      }
      return buffer;
    }

    unlock() {
      this.ensureContext();
      if (this.musicEnabled && !this.musicTimer) {
        this.startMusicLoop();
      }
    }

    setSfxEnabled(on) {
      this.sfxEnabled = !!on;
    }

    setMusicEnabled(on) {
      this.musicEnabled = !!on;
      if (!this.musicEnabled) {
        this.stopMusicLoop();
      } else if (this.ctx) {
        this.startMusicLoop();
      }
    }

    setFever(active) {
      if (this.feverMode !== !!active) {
        this.feverMode = !!active;
        if (this.musicTimer) {
          this.stopMusicLoop();
          this.startMusicLoop();
        }
      }
    }

    playTone({ type = 'sine', freq = 440, endFreq = null, duration = 0.14, gain = 0.09, delay = 0, attack = 0.012 }) {
      if (!this.sfxEnabled) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
      }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.03);
    }

    playNoise({ filterType = 'bandpass', freq = 750, q = 1.0, duration = 0.09, gain = 0.055, delay = 0 }) {
      if (!this.sfxEnabled) return;
      const ctx = this.ensureContext();
      if (!ctx || !this.noiseBuffer) return;

      const t = ctx.currentTime + delay;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(freq, t);
      filter.Q.setValueAtTime(q, t);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      src.stop(t + duration + 0.03);
    }

    playButtonClick() {
      this.playTone({ type: 'sine', freq: 520, endFreq: 610, duration: 0.05, gain: 0.045 });
    }

    playRoomSwitch() {
      this.playNoise({ filterType: 'lowpass', freq: 420, duration: 0.08, gain: 0.04 });
      this.playTone({ type: 'sine', freq: 330, endFreq: 392, duration: 0.075, gain: 0.035 });
    }

    playGrabIngredient() {
      this.playTone({ type: 'sine', freq: 420, endFreq: 540, duration: 0.055, gain: 0.05 });
    }

    playDoughSlap() {
      this.playTone({ type: 'sine', freq: 132, endFreq: 48, duration: 0.14, gain: 0.16 });
      this.playNoise({ filterType: 'lowpass', freq: 520, q: 0.7, duration: 0.11, gain: 0.065 });
    }

    playSauceSwirl() {
      const now = performance.now();
      if (now - this.lastSwirlTime < 95) return;
      this.lastSwirlTime = now;
      this.playNoise({ filterType: 'bandpass', freq: 640 + Math.random() * 180, q: 1.4, duration: 0.095, gain: 0.048 });
    }

    playCheeseSprinkle() {
      const now = performance.now();
      if (now - this.lastSwirlTime < 85) return;
      this.lastSwirlTime = now;
      this.playNoise({ filterType: 'bandpass', freq: 1800 + Math.random() * 400, q: 1.1, duration: 0.06, gain: 0.032 });
    }

    playToppingPlop(stepIndex = 0) {
      const scale = [392.0, 440.0, 493.88, 587.33, 659.25, 783.99];
      const base = scale[stepIndex % scale.length];
      this.playTone({ type: 'sine', freq: base * 0.78, endFreq: base, duration: 0.075, gain: 0.065 });
    }

    playOvenSlide() {
      this.playNoise({ filterType: 'lowpass', freq: 440, q: 0.8, duration: 0.2, gain: 0.075 });
      this.playTone({ type: 'sine', freq: 165, endFreq: 112, duration: 0.15, gain: 0.06 });
    }

    playOvenDing() {
      // Soft warm brass kitchen pass bell
      this.playTone({ type: 'sine', freq: 987.77, duration: 0.65, gain: 0.085 });
      this.playTone({ type: 'sine', freq: 1975.5, duration: 0.4, gain: 0.032 });
    }

    playBurnWarn() {
      const now = performance.now();
      if (now - this.lastBurnWarn < 2000) return;
      this.lastBurnWarn = now;
      // Gentle sizzling hiss instead of irritating alarm
      this.playNoise({ filterType: 'highpass', freq: 2400, q: 0.8, duration: 0.22, gain: 0.05 });
      this.playTone({ type: 'triangle', freq: 370, endFreq: 330, duration: 0.11, gain: 0.04 });
    }

    playSliceCrunch() {
      this.playNoise({ filterType: 'bandpass', freq: 1950, q: 1.0, duration: 0.09, gain: 0.09 });
      this.playTone({ type: 'triangle', freq: 260, endFreq: 135, duration: 0.065, gain: 0.05 });
    }

    playSodaPour() {
      this.playNoise({ filterType: 'highpass', freq: 2600, q: 1.2, duration: 0.16, gain: 0.05 });
      this.playTone({ type: 'sine', freq: 560, endFreq: 840, duration: 0.13, gain: 0.05 });
    }

    playDoorChime() {
      // Delicate shopkeeper brass door chime
      this.playTone({ type: 'sine', freq: 1046.5, duration: 0.35, gain: 0.045 });
      this.playTone({ type: 'sine', freq: 1318.5, duration: 0.45, gain: 0.04, delay: 0.09 });
    }

    playGreetGuest() {
      this.playTone({ type: 'sine', freq: 587.33, duration: 0.14, gain: 0.06 });
      this.playTone({ type: 'sine', freq: 783.99, duration: 0.2, gain: 0.065, delay: 0.06 });
    }

    playPlateDown() {
      this.playTone({ type: 'sine', freq: 740, endFreq: 520, duration: 0.075, gain: 0.055 });
    }

    playTableBus() {
      this.playNoise({ filterType: 'bandpass', freq: 1200, q: 1.2, duration: 0.12, gain: 0.05 });
      this.playTone({ type: 'sine', freq: 1174.66, duration: 0.14, gain: 0.065, delay: 0.04 });
      this.playTone({ type: 'sine', freq: 1567.98, duration: 0.2, gain: 0.06, delay: 0.09 });
    }

    playServePerfect() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        this.playTone({ type: 'sine', freq: n, duration: 0.28, gain: 0.075, delay: idx * 0.06 });
      });
    }

    playServeGreat() {
      this.playTone({ type: 'sine', freq: 523.25, duration: 0.22, gain: 0.07 });
      this.playTone({ type: 'sine', freq: 659.25, duration: 0.26, gain: 0.07, delay: 0.065 });
      this.playTone({ type: 'sine', freq: 783.99, duration: 0.3, gain: 0.065, delay: 0.13 });
    }

    playServeOkay() {
      this.playTone({ type: 'sine', freq: 440, duration: 0.16, gain: 0.06 });
      this.playTone({ type: 'sine', freq: 493.88, duration: 0.2, gain: 0.055, delay: 0.09 });
    }

    playServeBad() {
      this.playTone({ type: 'triangle', freq: 245, endFreq: 185, duration: 0.22, gain: 0.06 });
      this.playTone({ type: 'triangle', freq: 196, endFreq: 146, duration: 0.26, gain: 0.055, delay: 0.12 });
    }

    playCoinTick() {
      this.playTone({ type: 'sine', freq: 1318.5, duration: 0.1, gain: 0.048 });
      this.playTone({ type: 'sine', freq: 1760.0, duration: 0.14, gain: 0.04, delay: 0.035 });
    }

    playFeverStart() {
      [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((n, idx) => {
        this.playTone({ type: 'sine', freq: n, duration: 0.4, gain: 0.075, delay: idx * 0.05 });
      });
    }

    playUpgradeBuy() {
      this.playTone({ type: 'sine', freq: 587.33, duration: 0.16, gain: 0.07 });
      this.playTone({ type: 'sine', freq: 880.0, duration: 0.22, gain: 0.075, delay: 0.07 });
      this.playTone({ type: 'sine', freq: 1174.66, duration: 0.32, gain: 0.07, delay: 0.14 });
    }

    playTrash() {
      this.playTone({ type: 'sine', freq: 150, endFreq: 68, duration: 0.16, gain: 0.1 });
      this.playNoise({ filterType: 'lowpass', freq: 380, duration: 0.1, gain: 0.05 });
    }

    playDayComplete() {
      const melody = [523.25, 659.25, 783.99, 1046.5];
      melody.forEach((n, i) => {
        this.playTone({ type: 'sine', freq: n, duration: i === 3 ? 0.55 : 0.2, gain: 0.075, delay: i * 0.1 });
      });
    }

    startMusicLoop() {
      this.stopMusicLoop();
      if (!this.musicEnabled) return;
      // Soft, warm Italian bistro jazz/acoustic progression (quiet & hypnotic!)
      const stepMs = this.feverMode ? 310 : 380;
      const chords = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [196.0, 246.94, 293.66, 349.23], // G7
      ];

      this.musicTimer = window.setInterval(() => {
        if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;
        const bar = Math.floor(this.musicStep / 4) % chords.length;
        const beat = this.musicStep % 4;
        this.musicStep++;

        const chord = chords[bar];
        const t = this.ctx.currentTime;

        if (beat === 0) {
          // Soft warm bass + gentle chord swell
          chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(idx === 0 ? freq * 0.5 : freq, t + idx * 0.02);
            const vol = idx === 0 ? 0.022 : 0.011;
            g.gain.setValueAtTime(0.0001, t + idx * 0.02);
            g.gain.linearRampToValueAtTime(this.feverMode ? vol * 1.25 : vol, t + idx * 0.02 + 0.06);
            g.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.02 + 1.1);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t + idx * 0.02);
            osc.stop(t + idx * 0.02 + 1.15);
          });
        } else if (beat === 2 || (this.feverMode && beat === 3)) {
          // Delicate acoustic pluck
          const note = chord[(beat + bar) % chord.length] * 2;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(note, t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.014, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.36);
        }
      }, stepMs);
    }

    stopMusicLoop() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }
  }

  FR.Audio = new SoundEngine();
})();
