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
  
  // Determine which symbol each player is
  const player1 = room.players[0];
  const player2 = room.players[1];
  const amIPlayerX = playerId === player1?.id;
  const mySymbol = amIPlayerX ? 'X' : 'O';
  const isHost = room?.hostId === playerId;
  
  // Check if it's my turn
  const isMyTurn = currentPlayer === mySymbol;

  // Debug logging
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

  // Determine winner name
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-blue-500/30 shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">❌⭕</span>
            Tic-Tac-Toe
          </h2>
          <div className="text-sm">
            {winner ? (
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${winner === mySymbol ? 'text-green-400' : 'text-red-400'}`}>
                  {winner === mySymbol ? '🎉 You Won!' : '😢 You Lost'}
                </div>
                <div className="text-white/60 text-sm">
                  {winnerName} wins!
                </div>
              </div>
            ) : isDraw ? (
              <span className="text-yellow-400 font-bold text-lg">🤝 It's a Draw!</span>
            ) : (
              <span className={isMyTurn ? 'text-blue-400 font-bold text-lg' : 'text-white/60'}>
                {isMyTurn ? "⚡ Your turn!" : "⏳ Opponent's turn"}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 items-center justify-center">
            {room.players.map((player, idx) => {
              const symbol = idx === 0 ? 'X' : 'O';
              const isCurrentTurn = currentPlayer === symbol && !gameOver;
              
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                    player.id === playerId 
                      ? 'bg-blue-500/30 border-2 border-blue-400/50' 
                      : 'bg-white/5 border border-white/10'
                  } ${isCurrentTurn ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}
                >
                  <span className="font-bold text-3xl text-blue-300">{symbol}</span>
                  <div>
                    <span className="text-white font-medium">{player.name}</span>
                    {player.id === playerId && <span className="text-xs text-white/60 ml-2">(you)</span>}
                    {isCurrentTurn && <div className="text-xs text-blue-400 font-semibold">Playing...</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
          {board.map((cell: string | null, index: number) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameOver || !isMyTurn}
              className={`aspect-square text-6xl font-bold rounded-2xl transition-all ${
                cell
                  ? 'bg-white/5 cursor-not-allowed border-2 border-white/10'
                  : isMyTurn && !gameOver
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-400/50 cursor-pointer hover:scale-105 active:scale-95'
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
              <div className={`text-center p-6 rounded-2xl ${
                winner === mySymbol 
                  ? 'bg-green-500/20 border-2 border-green-500/50' 
                  : 'bg-red-500/20 border-2 border-red-500/50'
              }`}>
                <div className="text-6xl mb-3 animate-bounce">
                  {winner === mySymbol ? '🏆' : '💪'}
                </div>
                <div className="text-white font-bold text-2xl mb-2">
                  {winner === mySymbol ? 'Victory!' : 'Good Try!'}
                </div>
                <div className="text-white/70">
                  {winnerName} ({winner}) wins the game!
                </div>
              </div>
            )}

            {isDraw && (
              <div className="text-center p-6 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500/50">
                <div className="text-6xl mb-3 animate-bounce">🤝</div>
                <div className="text-white font-bold text-2xl mb-2">
                  It's a Draw!
                </div>
                <div className="text-white/70">
                  Well played by both sides!
                </div>
              </div>
            )}

            <div>
              {!isHost && (
                <p className="text-white/60 text-sm mb-4 text-center">👑 Waiting for host to start next round...</p>
              )}
              <button
                onClick={playAgain}
                disabled={!isHost}
                className={`w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform shadow-lg ${
                  isHost 
                    ? 'hover:from-blue-700 hover:to-cyan-700 hover:scale-105 active:scale-95' 
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