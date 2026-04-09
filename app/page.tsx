'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../hooks/useSocket';
import { GameType } from '../types/game';
import { useAuthStore } from '../store/authStore';

const games = [
  { 
    id: 'tic-tac-toe' as GameType, 
    name: 'Tic-Tac-Toe', 
    emoji: '❌⭕', 
    description: 'Classic 3x3 strategy',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'drawing' as GameType, 
    name: 'Pictionary', 
    emoji: '🎨', 
    description: 'Draw and guess',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'trivia' as GameType, 
    name: 'Trivia', 
    emoji: '🧠', 
    description: 'Test your knowledge',
    color: 'from-orange-500 to-red-500'
  },
  { 
    id: 'would-you-rather' as GameType, 
    name: 'Would You Rather', 
    emoji: '🤔', 
    description: 'Tough choices',
    color: 'from-green-500 to-emerald-500'
  },
];

export default function Home() {
  const router = useRouter();
  const { isConnected, createRoom, joinRoom } = useSocket();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [playerName, setPlayerName] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name first');
      return;
    }
    if (!selectedGame) {
      setError('Please select a game');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createRoom(playerName);
      router.push(`/room/${response.room.code}?game=${selectedGame}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinRoom(roomCode.toUpperCase(), playerName);
      router.push(`/room/${roomCode.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Login/User Section */}
          <div className="flex items-center justify-end mb-4 gap-3">
            {isClient && isAuthenticated() ? (
              <>
                <button
                  onClick={() => router.push('/history')}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <span>📊</span> History
                </button>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 px-6 py-3 flex items-center gap-3">
                  <div>
                    <div className="text-white/70 text-sm">Welcome back,</div>
                    <div className="text-white font-semibold">{user?.username}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      window.location.reload();
                    }}
                    className="text-white/60 hover:text-white text-sm transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : isClient ? (
              <button
                onClick={() => router.push('/login')}
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <span>🔐</span> Login / Register
              </button>
            ) : (
              <div className="h-12 w-48 bg-white/10 rounded-xl animate-pulse" />
            )}
          </div>

          <h1 className="text-6xl font-bold text-white mb-3 tracking-tight">
            Game Room
          </h1>
          <p className="text-xl text-purple-200">Play together, stay connected</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-white/90 text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 mb-6 animate-slide-up">
          {/* Player Name Input */}
          <div className="mb-8">
            <label className="block text-white/90 text-sm font-medium mb-3">
              What's your name?
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          {/* Game Selection */}
          <div className="mb-8">
            <label className="block text-white/90 text-sm font-medium mb-4">
              Choose a game
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 ${
                    selectedGame === game.id
                      ? 'ring-4 ring-white shadow-2xl scale-105'
                      : 'hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative z-10">
                    <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
                      {game.emoji}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">{game.name}</h3>
                    <p className="text-white/80 text-sm">{game.description}</p>
                  </div>
                  {selectedGame === game.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleCreateRoom}
              disabled={loading || !isConnected || !playerName || !selectedGame}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                '🚀 Create Room'
              )}
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 bg-white/10 backdrop-blur-lg border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transition-all transform hover:scale-105 active:scale-95"
            >
              🔗 Join Room
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-delay">
          {[
            { icon: '⚡', title: 'Real-time Play', desc: 'Play together instantly' },
            { icon: '🎯', title: 'Turn-based Mode', desc: 'Play at your own pace' },
            { icon: '🔒', title: 'Private Rooms', desc: 'Secure room codes' },
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 rounded-3xl border border-white/20 p-8 max-w-md w-full shadow-2xl animate-slide-up">
            <h2 className="text-2xl font-bold text-white mb-6">Join a Room</h2>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}