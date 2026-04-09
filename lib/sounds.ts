class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Create sound effects using Web Audio API / data URIs
      this.loadSounds();
    }
  }

  private loadSounds() {
    // We'll use simple beep sounds for now
    // You can replace these with actual sound files later
    const soundEffects = {
      click: this.createBeep(400, 0.1),
      success: this.createBeep(600, 0.2),
      error: this.createBeep(200, 0.2),
      message: this.createBeep(500, 0.15),
      gameStart: this.createBeep(800, 0.3),
      win: this.createBeep(1000, 0.5),
    };

    Object.entries(soundEffects).forEach(([name, audio]) => {
      this.sounds.set(name, audio);
    });
  }

  private createBeep(frequency: number, duration: number): HTMLAudioElement {
    // For now, we'll use a simple approach
    // In production, you'd use actual audio files
    const audio = new Audio();
    audio.volume = 0.3;
    return audio;
  }

  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore errors (browser might block autoplay)
      });
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();