'use client';

import { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';
import { soundManager } from '../../lib/sounds';

export default function Pictionary() {
  const { room, playerId, gameState } = useGameStore();
  const { makeMove, restartGame } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [guess, setGuess] = useState('');
  const [showScores, setShowScores] = useState(false);
  const [currentPath, setCurrentPath] = useState<any[]>([]);

  if (!gameState || !room) return null;

  const { prompt, drawer, guesser, drawing, guesses, isCorrect, timeLeft, scores, round, maxRounds } = gameState.data;
  const isHost = room.hostId === playerId;
  const isDrawer = drawer === playerId;
  const isGuesser = guesser === playerId;
  const me = room.players.find(p => p.id === playerId);
  const opponent = room.players.find(p => p.id !== playerId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawing.forEach((path: any) => {
      if (path.length < 2) return;

      ctx.strokeStyle = path[0].color;
      ctx.lineWidth = path[0].size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      
      ctx.stroke();
    });

    if (currentPath.length > 1) {
      ctx.strokeStyle = currentPath[0].color;
      ctx.lineWidth = currentPath[0].size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      
      ctx.stroke();
    }
  }, [drawing, currentPath]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || isCorrect) return;
    setIsDrawing(true);
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const newPath = [{ ...coords, color, size: brushSize }];
    setCurrentPath(newPath);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || isCorrect) return;
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const updatedPath = [...currentPath, { ...coords, color, size: brushSize }];
    setCurrentPath(updatedPath);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length > 1 && room) {
      makeMove(room.code, {
        type: 'draw',
        path: currentPath,
      });
    }
    
    setCurrentPath([]);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || isCorrect) return;
    e.preventDefault();
    setIsDrawing(true);
    
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    const newPath = [{ ...coords, color, size: brushSize }];
    setCurrentPath(newPath);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || isCorrect) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    const updatedPath = [...currentPath, { ...coords, color, size: brushSize }];
    setCurrentPath(updatedPath);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    if (!isDrawer || !room) return;
    makeMove(room.code, { type: 'clear' });
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !room || isCorrect) return;
    
    makeMove(room.code, { 
      type: 'guess', 
      guess: guess.trim(),
      playerId 
    });
    setGuess('');
  };

  const nextRound = () => {
    if (!room || !isHost) return;
    soundManager.play('gameStart');
    
    if (round >= maxRounds) {
      setShowScores(true);
    } else {
      makeMove(room.code, { type: 'next-round' });
    }
  };

  const viewResults = () => {
    setShowScores(true);
  };

  const closeScores = () => {
    setShowScores(false);
  };

  const playAgain = () => {
    if (!room || !isHost) return;
    soundManager.play('gameStart');
    restartGame(room.code);
  };

  const gameOver = round > maxRounds;
  const myScore = scores?.[playerId!] || 0;
  const opponentScore = opponent ? (scores?.[opponent.id] || 0) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-2xl p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">🎨</span>
              Pictionary
            </h2>
            <p className="text-purple-300 text-sm sm:text-base">Round {round} of {maxRounds}</p>
          </div>
          <div className="text-center">
            <div className="text-purple-300 text-xs sm:text-sm mb-1">Time Left</div>
            <div className={`text-2xl sm:text-3xl font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Players & Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className={`p-3 sm:p-4 rounded-xl ${isDrawer ? 'bg-purple-500/30 border-2 border-purple-400/50' : 'bg-white/5 border border-white/10'}`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                {me?.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm sm:text-base">{me?.name}</div>
                <div className="text-white/60 text-xs sm:text-sm">
                  {isDrawer ? '🎨 Drawing' : '🤔 Guessing'}
                </div>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-300">{myScore} pts</div>
          </div>

          <div className={`p-3 sm:p-4 rounded-xl ${!isDrawer ? 'bg-purple-500/30 border-2 border-purple-400/50' : 'bg-white/5 border border-white/10'}`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                {opponent?.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm sm:text-base">{opponent?.name}</div>
                <div className="text-white/60 text-xs sm:text-sm">
                  {!isDrawer ? '🎨 Drawing' : '🤔 Guessing'}
                </div>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-cyan-300">{opponentScore} pts</div>
          </div>
        </div>

        {/* Prompt (only for drawer) */}
        {isDrawer && (
          <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-center">
            <div className="text-white/80 text-xs sm:text-sm mb-1">Draw this:</div>
            <div className="text-white font-bold text-xl sm:text-3xl uppercase tracking-wide">{prompt}</div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {/* Canvas */}
          <div className="md:col-span-2">
            <div className="bg-slate-800 rounded-2xl overflow-hidden border-4 border-white/10">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`w-full ${isDrawer && !isCorrect ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
                style={{ touchAction: 'none', maxHeight: '400px' }}
              />
            </div>

            {/* Drawing Controls */}
            {isDrawer && !isCorrect && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                <div className="flex gap-2 flex-wrap justify-center">
                  {['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-transform active:scale-90 ${
                        color === c ? 'border-white scale-110' : 'border-white/30'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="flex-1 min-w-[120px]"
                />
                <span className="text-white text-xs sm:text-sm w-12 text-center">{brushSize}px</span>
                
                <button
                  onClick={clearCanvas}
                  className="bg-red-500/20 border border-red-500/50 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all text-sm sm:text-base active:scale-95"
                >
                  🗑️ Clear
                </button>
              </div>
            )}
          </div>

          {/* Guessing Area */}
          <div className="flex flex-col">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 flex-1 flex flex-col">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                💬 Guesses
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-48 sm:max-h-64">
                {guesses.map((g: string, i: number) => (
                  <div key={i} className="bg-white/5 rounded-lg px-3 py-2 text-white text-xs sm:text-sm">
                    {g}
                  </div>
                ))}
              </div>

              {isCorrect ? (
                <div className="bg-green-500/20 border-2 border-green-500/50 rounded-xl p-4 text-center">
                  <div className="text-3xl sm:text-4xl mb-2">✅</div>
                  <div className="text-green-400 font-bold text-base sm:text-lg mb-1">Correct!</div>
                  <div className="text-white/80 text-xs sm:text-sm">The word was: <span className="font-bold uppercase">{prompt}</span></div>
                  
                  {gameState.data.guessCount && gameState.data.pointsEarned && (
                    <div className="mt-3 p-2 sm:p-3 bg-white/10 rounded-lg">
                      <div className="text-white/70 text-xs mb-1">
                        Solved in {gameState.data.guessCount} {gameState.data.guessCount === 1 ? 'guess' : 'guesses'}!
                      </div>
                      <div className="text-yellow-400 font-bold text-lg sm:text-xl">
                        {isGuesser ? `+${gameState.data.pointsEarned}` : '+5'} pts
                      </div>
                      {gameState.data.guessCount === 1 && isGuesser && (
                        <div className="text-green-400 text-xs mt-1 font-semibold">🎯 First Try Bonus!</div>
                      )}
                    </div>
                  )}
                  
                  {!gameOver && (
                    <div className="mt-4 space-y-2">
                      {!isHost && (
                        <p className="text-white/60 text-xs">👑 Waiting for host...</p>
                      )}
                      <button
                        onClick={nextRound}
                        disabled={!isHost}
                        className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm sm:text-base ${
                          isHost 
                            ? 'hover:from-purple-700 hover:to-pink-700 active:scale-95' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {isHost ? '▶️ Next Round' : '⏳ Waiting...'}
                      </button>
                    </div>
                  )}
                  
                  {gameOver && (
                    <div className="mt-4">
                      <button
                        onClick={viewResults}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all active:scale-95 text-sm sm:text-base"
                      >
                        📊 View Results
                      </button>
                    </div>
                  )}
                </div>
              ) : isGuesser ? (
                <form onSubmit={submitGuess} className="flex gap-2">
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Type your guess..."
                    className="flex-1 px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-purple-700 transition-all font-semibold text-sm sm:text-base active:scale-95"
                  >
                    Send
                  </button>
                </form>
              ) : (
                <div className="text-center text-white/60 text-xs sm:text-sm p-4 bg-white/5 rounded-xl">
                  ⏳ Waiting for {opponent?.name} to guess...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scores Modal */}
      {showScores && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 rounded-3xl border border-purple-500/30 p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">🏆 Final Results</h2>
            
            <div className="space-y-4 mb-6">
              <div className={`p-4 sm:p-6 rounded-2xl ${myScore > opponentScore ? 'bg-green-500/20 border-2 border-green-500/50' : myScore < opponentScore ? 'bg-red-500/20 border-2 border-red-500/50' : 'bg-yellow-500/20 border-2 border-yellow-500/50'}`}>
                <div className="text-center mb-2">
                  <div className="text-4xl sm:text-5xl mb-2">
                    {myScore > opponentScore ? '🥇' : myScore < opponentScore ? '🥈' : '🤝'}
                  </div>
                  <div className="text-white font-bold text-lg sm:text-xl mb-1">{me?.name}</div>
                  <div className="text-3xl sm:text-4xl font-bold text-white">{myScore} pts</div>
                </div>
              </div>

              <div className={`p-4 sm:p-6 rounded-2xl ${opponentScore > myScore ? 'bg-green-500/20 border-2 border-green-500/50' : opponentScore < myScore ? 'bg-red-500/20 border-2 border-red-500/50' : 'bg-yellow-500/20 border-2 border-yellow-500/50'}`}>
                <div className="text-center mb-2">
                  <div className="text-4xl sm:text-5xl mb-2">
                    {opponentScore > myScore ? '🥇' : opponentScore < myScore ? '🥈' : '🤝'}
                  </div>
                  <div className="text-white font-bold text-lg sm:text-xl mb-1">{opponent?.name}</div>
                  <div className="text-3xl sm:text-4xl font-bold text-white">{opponentScore} pts</div>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                {myScore > opponentScore ? '🎉 You Won!' : myScore < opponentScore ? '😢 You Lost' : '🤝 It\'s a Tie!'}
              </div>
              <div className="text-white/60 text-sm sm:text-base">Great game!</div>
            </div>

            <div className="space-y-3">
              {!isHost && (
                <p className="text-white/60 text-xs sm:text-sm text-center">👑 Waiting for host...</p>
              )}
              <button
                onClick={playAgain}
                disabled={!isHost}
                className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all text-sm sm:text-base ${
                  isHost 
                    ? 'hover:from-purple-700 hover:to-pink-700 active:scale-95' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isHost ? '🔄 Play Again' : '⏳ Waiting for host...'}
              </button>
              <button
                onClick={closeScores}
                className="w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}