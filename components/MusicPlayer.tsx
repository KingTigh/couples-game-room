'use client';

import { useEffect, useState } from 'react';
import { musicPlayer } from '../lib/musicPlayer';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [currentSong, setCurrentSong] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // List your MP3 files here (put them in public/music/)
        const songs = [
        '/music/song1.mp3',  // ✅ CORRECT
        '/music/song2.mp3',
        '/music/song3.mp3',
        '/music/song4.mp3',
        '/music/song5.mp3',
        ];

    musicPlayer.initialize(songs);
    setIsInitialized(true);
    setCurrentSong(musicPlayer.getCurrentSong());

    // Update current song every second
    const interval = setInterval(() => {
      setCurrentSong(musicPlayer.getCurrentSong());
      setIsPlaying(musicPlayer.isCurrentlyPlaying());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    if (!isInitialized) return;
    musicPlayer.toggle();
    setIsPlaying(musicPlayer.isCurrentlyPlaying());
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    musicPlayer.setVolume(newVolume / 100);
  };

  const playNext = () => {
    musicPlayer.playNext();
    setCurrentSong(musicPlayer.getCurrentSong());
  };

  const playPrevious = () => {
    musicPlayer.playPrevious();
    setCurrentSong(musicPlayer.getCurrentSong());
  };

  if (!isInitialized) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Collapsed Music Button */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
        >
          {isPlaying ? '🎵' : '🎶'}
        </button>
      )}

      {/* Expanded Music Controls */}
      {showControls && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl w-80 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              🎵 Now Playing
            </h3>
            <button
              onClick={() => setShowControls(false)}
              className="text-white/60 hover:text-white text-xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Song Title */}
          <div className="mb-4 bg-white/5 rounded-lg p-2 text-center">
            <p className="text-white/90 text-xs font-medium truncate">
              {currentSong || 'No song playing'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={playPrevious}
              className="text-white/80 hover:text-white text-2xl transition-colors active:scale-90"
            >
              ⏮️
            </button>
            <button
              onClick={togglePlay}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button
              onClick={playNext}
              className="text-white/80 hover:text-white text-2xl transition-colors active:scale-90"
            >
              ⏭️
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-lg">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(219, 39, 119) ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <span className="text-white/60 text-xs w-8">{volume}%</span>
          </div>
        </div>
      )}
    </div>
  );
}