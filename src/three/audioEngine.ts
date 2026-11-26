export type VoiceEngine = 'elevenlabs' | 'gemini' | 'browser';

export class KidsAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private mediaDest: MediaStreamAudioDestinationNode | null = null;
  private loopTimer: number | null = null;
  private step = 0;
  private isPlayingMusic = false;
  private isLullaby = false;
  private muted = false;
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeSfxSource: AudioBufferSourceNode | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.48;
      this.masterGain.connect(this.ctx.destination);
      this.mediaDest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.mediaDest);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public getRecordingStream(): MediaStream | null {
    this.ensureContext();
    return this.mediaDest?.stream ?? null;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.48, this.ctx.currentTime, 0.04);
    }
    if (mute) {
      this.stopVoice();
    }
  }

  public stopVoice() {
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
      } catch {
        // already stopped
      }
      this.activeVoiceSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public async playBase64IntoMix(base64: string, isVoice = true, gainLevel = 1.0) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const audioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;

    const g = this.ctx.createGain();
    g.gain.value = gainLevel;
    source.connect(g);
    g.connect(this.masterGain);

    if (isVoice) {
      this.stopVoice();
      this.activeVoiceSource = source;
    } else {
      if (this.activeSfxSource) {
        try {
          this.activeSfxSource.stop();
        } catch {
          // ignore
        }
      }
      this.activeSfxSource = source;
    }

    source.start(0);
  }

  public playWhistle() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const now = this.ctx.currentTime;
    const playTone = (start: number, dur: number, f1: number, f2: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(f1, start);
      osc2.frequency.setValueAtTime(f2, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.28, start + 0.04);
      gain.gain.setValueAtTime(0.24, start + dur - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + dur);
      osc2.stop(start + dur);
    };

    playTone(now, 0.24, 523.25, 659.25);
    playTone(now + 0.3, 0.42, 587.33, 783.99);
  }

  public playSparkle() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  }

  private playMarimbaNote(freq: number, duration: number, volume = 0.14) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = this.isLullaby ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playChug(soft = false) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = soft ? 650 : 1100;
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.value = soft ? 0.035 : 0.07;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  public startMusic(episodeId: number) {
    this.ensureContext();
    this.stopMusic();
    this.isPlayingMusic = true;
    this.isLullaby = episodeId === 6;
    this.step = 0;

    const upbeatMelody = [
      523.25, 659.25, 783.99, 659.25,
      880.0, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99,
      659.25, 587.33, 523.25, 0,
    ];
    const lullabyMelody = [
      523.25, 0, 659.25, 0,
      783.99, 0, 659.25, 0,
      587.33, 0, 659.25, 0,
      523.25, 0, 392.0, 0,
    ];
    const bassLine = [261.63, 0, 196.0, 0, 220.0, 0, 196.0, 0];

    const intervalMs = this.isLullaby ? 340 : 220;

    this.loopTimer = window.setInterval(() => {
      if (!this.isPlayingMusic || !this.ctx) return;
      const melody = this.isLullaby ? lullabyMelody : upbeatMelody;
      const note = melody[this.step % melody.length];
      const bass = bassLine[this.step % bassLine.length];

      if (note > 0) {
        this.playMarimbaNote(note, this.isLullaby ? 0.55 : 0.24, this.isLullaby ? 0.11 : 0.13);
      }
      if (bass > 0) {
        this.playMarimbaNote(bass, 0.3, 0.08);
      }
      if (!this.isLullaby && this.step % 2 === 0) {
        this.playChug(this.step % 4 !== 0);
      }
      this.step++;
    }, intervalMs);
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  public async speakLine(
    text: string,
    speaker: 'Narrator' | 'Mia' | 'Benny' | 'Pip',
    engine: VoiceEngine = 'browser'
  ): Promise<{ usedEngine: VoiceEngine; error?: string }> {
    if (this.muted || !text.trim()) return { usedEngine: engine };

    if (engine === 'elevenlabs') {
      try {
        const res = await fetch('/api/elevenlabs/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, speaker }),
        });
        const data = (await res.json()) as { audioBase64?: string; error?: string };
        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || 'ElevenLabs unavailable');
        }
        await this.playBase64IntoMix(data.audioBase64, true, 1.35);
        return { usedEngine: 'elevenlabs' };
      } catch (err: unknown) {
        this.speakWithBrowser(text, speaker);
        return {
          usedEngine: 'browser',
          error: err instanceof Error ? err.message : 'Fallback to browser voice',
        };
      }
    }

    if (engine === 'gemini') {
      const voiceMap: Record<string, string> = {
        Narrator: 'Zephyr',
        Mia: 'Kore',
        Benny: 'Puck',
        Pip: 'Charon',
      };
      try {
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName: voiceMap[speaker] || 'Zephyr',
          }),
        });
        const data = (await res.json()) as { audioBase64?: string; error?: string };
        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || 'Gemini TTS unavailable');
        }
        await this.playBase64IntoMix(data.audioBase64, true, 1.35);
        return { usedEngine: 'gemini' };
      } catch (err: unknown) {
        this.speakWithBrowser(text, speaker);
        return {
          usedEngine: 'browser',
          error: err instanceof Error ? err.message : 'Fallback to browser voice',
        };
      }
    }

    this.speakWithBrowser(text, speaker);
    return { usedEngine: 'browser' };
  }

  private speakWithBrowser(text: string, speaker: 'Narrator' | 'Mia' | 'Benny' | 'Pip') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const pitchMap = { Narrator: 1.08, Mia: 1.28, Benny: 1.22, Pip: 1.45 };
    const rateMap = { Narrator: 0.96, Mia: 1.0, Benny: 0.98, Pip: 0.94 };
    utter.pitch = pitchMap[speaker];
    utter.rate = rateMap[speaker];
    utter.volume = 0.95;
    window.speechSynthesis.speak(utter);
  }

  public dispose() {
    this.stopMusic();
    this.stopVoice();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
