'use client';

import { useGameStore } from '../store/gameStore';

interface ScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScoresModal({ isOpen, onClose }: ScoresModalProps) {
  const { scores, room } = useGameStore();

  if (!isOpen) return null;

  const getGameEmoji = (gameType: string) => {
    const emojis: Record<string, string> = {
      'tic-tac-toe': '❌⭕',
      'drawing': '🎨',
      'trivia': '🧠',
      'would-you-rather': '🤔',
    };
    return emojis[gameType] || '🎮';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-2xl w-full shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">Session Scores</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Players */}
        {room && (
          <div className="flex gap-4 mb-6">
            {room.players.map((player) => (
              <div
                key={player.id}
                className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                    {player.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{player.name}</div>
                    <div className={`text-sm ${player.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                      {player.isOnline ? '● Online' : '○ Offline'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scores List */}
        {scores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-white/60">No games played yet!</p>
            <p className="text-white/40 text-sm mt-2">Start playing to see your scores here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((score, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getGameEmoji(score.gameType)}</span>
                    <div>
                      <h3 className="text-white font-semibold capitalize">
                        {score.gameType.replace('-', ' ')}
                      </h3>
                      <p className="text-white/50 text-sm">
                        {new Date(score.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {score.winner && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-xl">
                      <span className="text-yellow-300 font-semibold">
                        🏆 {score.players.find(p => p.id === score.winner)?.name} Won!
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Player Scores */}
                <div className="flex gap-2 mt-3">
                  {score.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-center"
                    >
                      <div className="text-white/70 text-sm">{player.name}</div>
                      {player.score !== undefined && (
                        <div className="text-white font-bold text-lg">{player.score}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {scores.length > 0 && room && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{scores.length}</div>
              <div className="text-white/60 text-sm">Games Played</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {scores.filter(s => s.winner === room.players[0]?.id).length}
              </div>
              <div className="text-white/60 text-sm">{room.players[0]?.name} Wins</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {scores.filter(s => s.winner === room.players[1]?.id).length}
              </div>
              <div className="text-white/60 text-sm">{room.players[1]?.name} Wins</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}