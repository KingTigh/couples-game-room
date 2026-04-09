'use client';

import { use, useEffect, useState } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useSocket } from '../../../hooks/useSocket';
import TicTacToe from '../../../components/games/TicTacToe';
import WouldYouRather from '../../../components/games/WouldYouRather';
import Pictionary from '../../../components/games/Pictionary';
import Chat from '../../../components/Chat';
import ScoresModal from '../../../components/ScoresModal';
import Trivia from '../../../components/games/Trivia';
import { GameType, PlayMode } from '../../../types/game';
import { soundManager } from '../../../lib/sounds';
import { useRouter } from 'next/navigation';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { room, playerId, gameState, soundEnabled } = useGameStore();
 const { isConnected, startGame, endGame } = useSocket();
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedMode, setSelectedMode] = useState<PlayMode>('real-time');
  const [copied, setCopied] = useState(false);
  const [showScores, setShowScores] = useState(false);
  

  const isHost = room?.hostId === playerId;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(resolvedParams.code);
    setCopied(true);
    soundManager.play('click');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (selectedGame && room && isHost) {
      soundManager.play('gameStart');
      startGame(room.code, selectedGame, selectedMode);
    }
  };

  const handleGameSelect = (gameId: GameType) => {
    if (!isHost) return; // Only host can select
    setSelectedGame(gameId);
    soundManager.play('click');
  };

  const handleModeSelect = (mode: PlayMode) => {
    if (!isHost) return; // Only host can select
    setSelectedMode(mode);
    soundManager.play('click');
  };

  const handleLeaveRoom = () => {
    if (confirm('Are you sure you want to leave the room?')) {
      // Reset game store
      useGameStore.getState().reset();
      
      // Navigate home and force a full page reload to reset socket state
      window.location.href = '/';
    }
  };

const handleEndGame = () => {
  if (confirm('Are you sure you want to end this game?')) {
    if (!room) return;
    endGame(room.code);
  }
};

  const games = [
    { 
      id: 'tic-tac-toe' as GameType, 
      name: 'Tic-Tac-Toe', 
      emoji: '❌⭕', 
      description: 'Classic 3x3 strategy',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'from-slate-900 via-blue-900 to-slate-900'
    },
    { 
      id: 'drawing' as GameType, 
      name: 'Pictionary', 
      emoji: '🎨', 
      description: 'Draw and guess',
      color: 'from-purple-500 to-pink-500',
      gradient: 'from-slate-900 via-purple-900 to-slate-900'
    },
    { 
      id: 'trivia' as GameType, 
      name: 'Trivia', 
      emoji: '🧠', 
      description: 'Test your knowledge',
      color: 'from-orange-500 to-red-500',
      gradient: 'from-slate-900 via-orange-900 to-slate-900'
    },
    { 
      id: 'would-you-rather' as GameType, 
      name: 'Would You Rather', 
      emoji: '🤔', 
      description: 'Tough choices',
      color: 'from-green-500 to-emerald-500',
      gradient: 'from-slate-900 via-green-900 to-slate-900'
    },
  ];

  // Get background gradient based on current game
  const getBackgroundGradient = () => {
    if (!gameState) return 'from-slate-900 via-purple-900 to-slate-900';
    
    const game = games.find(g => g.id === gameState.gameType);
    return game?.gradient || 'from-slate-900 via-purple-900 to-slate-900';
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md">
          <p className="text-white">Loading room...</p>
        </div>
      </div>
    );
  }

  if (gameState) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} p-4 transition-all duration-1000`}>
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          {/* Top Bar */}
          <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3 flex items-center gap-4">
              <div>
                <div className="text-white/60 text-sm">Room Code</div>
                <code className="text-white font-mono font-bold text-lg">{resolvedParams.code}</code>
              </div>
              <button
                onClick={copyRoomCode}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEndGame}
                className="bg-red-500/20 backdrop-blur-xl rounded-2xl border border-red-500/50 px-6 py-3 text-white hover:bg-red-500/30 transition-all flex items-center gap-2"
              >
                🚪 End Game
              </button>
              <button
                onClick={() => setShowScores(true)}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3 text-white hover:bg-white/20 transition-all flex items-center gap-2"
              >
                📊 Scores
              </button>
              <button
                onClick={() => useGameStore.getState().toggleSound()}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3 text-white hover:bg-white/20 transition-all"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
          </div>

          {/* Game Component */}
          {gameState.gameType === 'tic-tac-toe' && <TicTacToe />}
          {gameState.gameType === 'would-you-rather' && <WouldYouRather />}
          {gameState.gameType === 'drawing' && <Pictionary />}
          {gameState.gameType === 'trivia' && <Trivia />}
        </div>

        {/* Chat */}
        <Chat />

        {/* Scores Modal */}
        <ScoresModal isOpen={showScores} onClose={() => setShowScores(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm">Room Code:</span>
                <code className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-xl font-mono font-bold border border-purple-500/30">
                  {resolvedParams.code}
                </code>
                <button
                  onClick={copyRoomCode}
                  className="text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-sm font-medium text-white">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <button
                onClick={() => setShowScores(true)}
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
              >
                📊 Scores
              </button>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500/20 backdrop-blur-lg border border-red-500/50 text-white px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all flex items-center gap-2"
              >
                🚪 Leave
              </button>
            </div>
          </div>

          {/* Players */}
          <div className="flex gap-3">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl ${
                  player.id === playerId 
                    ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold relative">
                  {player.name[0].toUpperCase()}
                  {player.isHost && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 w-5 h-5 rounded-full flex items-center justify-center text-xs">
                      👑
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium flex items-center gap-2">
                    {player.name}
                    {player.id === playerId && <span className="text-xs text-white/60">(you)</span>}
                    {player.isHost && <span className="text-xs text-yellow-400">Host</span>}
                  </div>
                  <div className={`text-xs ${player.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                    {player.isOnline ? '● Online' : '○ Offline'}
                  </div>
                </div>
              </div>
            ))}
            {room.players.length < room.maxPlayers && (
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border-2 border-dashed border-white/20">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/40">
                  ?
                </div>
                <span className="text-white/40">Waiting for player...</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Selection */}
        {room.players.length >= 2 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Your Game</h2>
              {!isHost && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-xl">
                  <span className="text-yellow-300 text-sm">👑 Waiting for host to start...</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  disabled={!isHost}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 ${
                    selectedGame === game.id
                      ? 'ring-4 ring-white shadow-2xl scale-105'
                      : isHost ? 'hover:shadow-xl' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative z-10">
                    <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
                      {game.emoji}
                    </div>
                    <h3 className="text-white font-bold text-xl mb-1">{game.name}</h3>
                    <p className="text-white/80 text-sm">{game.description}</p>
                  </div>
                  {selectedGame === game.id && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedGame && (
              <>
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-4">Play Mode</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleModeSelect('real-time')}
                      disabled={!isHost}
                      className={`px-6 py-4 rounded-xl border-2 transition-all ${
                        selectedMode === 'real-time'
                          ? 'border-purple-400 bg-purple-500/20'
                          : isHost ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-white/20 bg-white/5 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-3xl mb-2">⚡</div>
                      <div className="text-white font-semibold">Real-time</div>
                      <div className="text-white/60 text-sm">Play together now</div>
                    </button>
                    <button
                      onClick={() => handleModeSelect('turn-based')}
                      disabled={!isHost}
                      className={`px-6 py-4 rounded-xl border-2 transition-all ${
                        selectedMode === 'turn-based'
                          ? 'border-purple-400 bg-purple-500/20'
                          : isHost ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-white/20 bg-white/5 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-3xl mb-2">⏱️</div>
                      <div className="text-white font-semibold">Turn-based</div>
                      <div className="text-white/60 text-sm">Play at your pace</div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={!isHost}
                  className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg py-5 px-8 rounded-xl transition-all transform shadow-lg ${
                    isHost ? 'hover:from-purple-700 hover:to-pink-700 hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isHost ? '🚀 Start Game' : '⏳ Waiting for host...'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-12 text-center animate-pulse">
            <div className="text-7xl mb-6">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-3">Waiting for your partner...</h2>
            <p className="text-white/60">Share the room code to get started!</p>
          </div>
        )}
      </div>

      {/* Chat (available in lobby too) */}
      <Chat />

      {/* Scores Modal */}
      <ScoresModal isOpen={showScores} onClose={() => setShowScores(false)} />
    </div>
  );
}