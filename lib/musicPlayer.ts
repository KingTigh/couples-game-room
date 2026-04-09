class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playlist: string[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.3; // 30% volume by default

  initialize(songs: string[]) {
    if (typeof window === 'undefined') return;
    
    this.playlist = this.shuffleArray([...songs]);
    this.audio = new Audio();
    this.audio.volume = this.volume;
    
    this.audio.addEventListener('ended', () => {
      this.playNext();
    });
  }

  private shuffleArray(array: string[]): string[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  play() {
    if (!this.audio || this.playlist.length === 0) return;
    
    if (!this.isPlaying) {
      this.audio.src = this.playlist[this.currentIndex];
      this.audio.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
      this.isPlaying = true;
    } else {
      this.audio.play().catch(err => console.log('Play failed:', err));
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  playNext() {
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    if (this.audio) {
      this.audio.src = this.playlist[this.currentIndex];
      this.audio.play().catch(err => console.log('Play failed:', err));
    }
  }

  playPrevious() {
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    if (this.audio) {
      this.audio.src = this.playlist[this.currentIndex];
      this.audio.play().catch(err => console.log('Play failed:', err));
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  toggle() {
    if (!this.audio) return;
    
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  getCurrentSong(): string {
    if (this.playlist.length === 0) return '';
    return this.playlist[this.currentIndex].split('/').pop()?.replace('.mp3', '') || '';
  }

  isCurrentlyPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }
}

export const musicPlayer = new MusicPlayer();