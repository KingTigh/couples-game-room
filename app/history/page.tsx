'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { GameHistory } from '../../types/auth';
export default function HistoryPage() {
  const router = useRouter();
  const { user, token, gameHistory, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [serverHistory, setServerHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Fetch game history from server
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/game-history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setServerHistory(data.history);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, router, token]);

  const getGameEmoji = (gameType: string) => {
    const emojis: Record<string, string> = {
      'tic-tac-toe': '❌⭕',
      'drawing': '🎨',
      'trivia': '🧠',
      'would-you-rather': '🤔',
    };
    return emojis[gameType] || '🎮';
  };

  const getResultColor = (result: string) => {
    if (result === 'win') return 'text-green-400 bg-green-500/20 border-green-500/50';
    if (result === 'loss') return 'text-red-400 bg-red-500/20 border-red-500/50';
    return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
  };

  const getResultEmoji = (result: string) => {
    if (result === 'win') return '🏆';
    if (result === 'loss') return '😢';
    return '🤝';
  };

  const allHistory = [...gameHistory, ...serverHistory].sort((a, b) => b.playedAt - a.playedAt);

  // Calculate stats
  const totalGames = allHistory.length;
  const wins = allHistory.filter(g => g.result === 'win').length;
  const losses = allHistory.filter(g => g.result === 'loss').length;
  const draws = allHistory.filter(g => g.result === 'draw').length;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/')}
              className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-xl">
              <div className="text-white/70 text-sm">Logged in as</div>
              <div className="text-white font-semibold">{user?.username}</div>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-2">📊 Game History</h1>
          <p className="text-white/70 text-lg">Your gaming journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-4xl font-bold text-white mb-1">{totalGames}</div>
            <div className="text-white/60 text-sm">Total Games</div>
          </div>
          <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 text-center">
            <div className="text-4xl font-bold text-green-400 mb-1">{wins}</div>
            <div className="text-white/60 text-sm">Wins</div>
          </div>
          <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6 text-center">
            <div className="text-4xl font-bold text-red-400 mb-1">{losses}</div>
            <div className="text-white/60 text-sm">Losses</div>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-1">{winRate}%</div>
            <div className="text-white/60 text-sm">Win Rate</div>
          </div>
        </div>

        {/* Game History List */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Games</h2>

          {allHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <p className="text-white/60 text-lg">No games played yet!</p>
              <p className="text-white/40 text-sm mt-2">Start playing to build your history</p>
              <button
                onClick={() => router.push('/')}
                className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Play Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allHistory.map((game, index) => (
                <div
                  key={game.id || index}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{getGameEmoji(game.gameType)}</span>
                      <div>
                        <h3 className="text-white font-bold text-lg capitalize">
                          {game.gameType.replace('-', ' ')}
                        </h3>
                        <p className="text-white/60 text-sm">
                          vs {game.opponentName}
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          {new Date(game.playedAt).toLocaleDateString()} at{' '}
                          {new Date(game.playedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${getResultColor(game.result)} font-bold mb-2`}>
                        <span className="text-2xl">{getResultEmoji(game.result)}</span>
                        <span className="uppercase">{game.result}</span>
                      </div>
                      <div className="text-white/60 text-sm">
                        Score: {game.myScore} - {game.opponentScore}
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        Room: {game.roomCode}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}