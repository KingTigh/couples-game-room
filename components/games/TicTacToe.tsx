'use client';

import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';
import { soundManager } from '../../lib/sounds';

export default function TicTacToe() {
  const { room, playerId, gameState } = useGameStore();
  const { makeMove, restartGame } = useSocket();

  if (!gameState || !room) return null;

  const { board, currentPlayer, winner, isDraw } = gameState.data;
  
  const player1 = room.players[0];
  const player2 = room.players[1];
  const amIPlayerX = playerId === player1?.id;
  const mySymbol = amIPlayerX ? 'X' : 'O';
  const isMyTurn = currentPlayer === mySymbol;
  const isHost = room?.hostId === playerId;

  useEffect(() => {
    console.log('Game state updated:', {
      status: gameState.status,
      winner,
      isDraw,
      currentPlayer,
      mySymbol,
      isMyTurn
    });
    
    if (gameState.status === 'finished') {
      console.log('🏁 Game finished!', { winner, isDraw });
    }
  }, [gameState, winner, isDraw, currentPlayer, mySymbol, isMyTurn]);

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isDraw || !isMyTurn || !room) return;
    
    console.log('Cell clicked:', index, 'Current player:', currentPlayer);
    soundManager.play('click');
    makeMove(room.code, { position: index });
  };

  const playAgain = () => {
    if (!room) return;
    console.log('Restarting game...');
    soundManager.play('gameStart');
    restartGame(room.code);
  };

  let winnerName = null;
  if (winner) {
    if (winner === 'X') {
      winnerName = player1?.name;
    } else {
      winnerName = player2?.name;
    }
  }

  const gameOver = winner || isDraw;

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-blue-500/30 shadow-2xl p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">❌⭕</span>
            <span className="hidden sm:inline">Tic-Tac-Toe</span>
          </h2>
          <div className="text-sm text-center">
            {winner ? (
              <div>
                <div className={`text-xl sm:text-2xl font-bold mb-1 ${winner === mySymbol ? 'text-green-400' : 'text-red-400'}`}>
                  {winner === mySymbol ? '🎉 You Won!' : '😢 You Lost'}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">
                  {winnerName} wins!
                </div>
              </div>
            ) : isDraw ? (
              <span className="text-yellow-400 font-bold text-base sm:text-lg">🤝 It's a Draw!</span>
            ) : (
              <span className={isMyTurn ? 'text-blue-400 font-bold text-base sm:text-lg' : 'text-white/60'}>
                {isMyTurn ? "⚡ Your turn!" : "⏳ Opponent's turn"}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
            {room.players.map((player, idx) => {
              const symbol = idx === 0 ? 'X' : 'O';
              const isCurrentTurn = currentPlayer === symbol && !gameOver;
              
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all w-full sm:w-auto ${
                    player.id === playerId 
                      ? 'bg-blue-500/30 border-2 border-blue-400/50' 
                      : 'bg-white/5 border border-white/10'
                  } ${isCurrentTurn ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}
                >
                  <span className="font-bold text-2xl sm:text-3xl text-blue-300">{symbol}</span>
                  <div className="flex-1">
                    <span className="text-white font-medium text-sm sm:text-base">{player.name}</span>
                    {player.id === playerId && <span className="text-xs text-white/60 ml-2">(you)</span>}
                    {isCurrentTurn && <div className="text-xs text-blue-400 font-semibold">Playing...</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 max-w-md mx-auto">
          {board.map((cell: string | null, index: number) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameOver || !isMyTurn}
              className={`aspect-square text-4xl sm:text-6xl font-bold rounded-xl sm:rounded-2xl transition-all min-h-[80px] sm:min-h-0 ${
                cell
                  ? 'bg-white/5 cursor-not-allowed border-2 border-white/10'
                  : isMyTurn && !gameOver
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-400/50 cursor-pointer active:scale-95'
                  : 'bg-white/5 cursor-not-allowed border-2 border-white/10'
              } ${cell === 'X' ? 'text-blue-400' : cell === 'O' ? 'text-cyan-400' : 'text-white/20'}`}
            >
              {cell || (isMyTurn && !gameOver ? '·' : '')}
            </button>
          ))}
        </div>

        {gameOver && (
          <div className="space-y-4 animate-slide-up">
            {winner && (
              <div className={`text-center p-4 sm:p-6 rounded-2xl ${
                winner === mySymbol 
                  ? 'bg-green-500/20 border-2 border-green-500/50' 
                  : 'bg-red-500/20 border-2 border-red-500/50'
              }`}>
                <div className="text-5xl sm:text-6xl mb-3">
                  {winner === mySymbol ? '🏆' : '💪'}
                </div>
                <div className="text-white font-bold text-xl sm:text-2xl mb-2">
                  {winner === mySymbol ? 'Victory!' : 'Good Try!'}
                </div>
                <div className="text-white/70 text-sm sm:text-base">
                  {winnerName} ({winner}) wins the game!
                </div>
              </div>
            )}

            {isDraw && (
              <div className="text-center p-4 sm:p-6 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500/50">
                <div className="text-5xl sm:text-6xl mb-3">🤝</div>
                <div className="text-white font-bold text-xl sm:text-2xl mb-2">
                  It's a Draw!
                </div>
                <div className="text-white/70 text-sm sm:text-base">
                  Well played by both sides!
                </div>
              </div>
            )}

            <div>
              {!isHost && (
                <p className="text-white/60 text-xs sm:text-sm mb-4 text-center">👑 Waiting for host to start next round...</p>
              )}
              <button
                onClick={playAgain}
                disabled={!isHost}
                className={`w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all transform shadow-lg text-sm sm:text-base ${
                  isHost 
                    ? 'hover:from-blue-700 hover:to-cyan-700 active:scale-95' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isHost ? '🔄 Play Again' : '⏳ Waiting for host...'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}