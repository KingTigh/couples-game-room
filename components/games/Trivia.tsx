'use client';

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';
import { soundManager } from '../../lib/sounds';

export default function Trivia() {
  const { room, playerId, gameState } = useGameStore();
  const { makeMove, restartGame } = useSocket();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  if (!gameState || !room) return null;

  const isHost = room.hostId === playerId;
  const { questions, currentQuestionIndex, answers, scores } = gameState.data;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const hasAnswered = answers[playerId!];
  const otherPlayer = room.players.find(p => p.id !== playerId);
  const bothAnswered = Object.keys(answers).length >= 2;
  const gameOver = gameState.status === 'finished';

  const myScore = scores?.[playerId!] || 0;
  const opponentScore = otherPlayer ? (scores?.[otherPlayer.id] || 0) : 0;

  const handleAnswer = (answer: string) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answer);
    soundManager.play('click');
    makeMove(room.code, { answer, playerId });
  };

  const nextQuestion = () => {
    if (!room || !isHost) return;
    soundManager.play('gameStart');
    setSelectedAnswer(null);
    makeMove(room.code, { type: 'next-question' });
  };

  const viewFinalResults = () => {
    setShowResults(true);
  };

  const closeFinalResults = () => {
    setShowResults(false);
  };

  const playAgain = () => {
    if (!room || !isHost) return;
    soundManager.play('gameStart');
    restartGame(room.code);
  };

  const getOptionColor = (option: string) => {
    if (!bothAnswered) return 'bg-white/5 hover:bg-orange-500/30';
    
    const isCorrect = option === currentQuestion.correctAnswer;
    const iSelected = selectedAnswer === option;
    
    if (isCorrect) return 'bg-green-500/30 border-2 border-green-500/50';
    if (iSelected && !isCorrect) return 'bg-red-500/30 border-2 border-red-500/50';
    return 'bg-white/5';
  };

  if (gameOver && !showResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-orange-500/30 shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-4xl font-bold text-white mb-2">Trivia Complete!</h2>
          <p className="text-orange-300 text-lg mb-6">All {totalQuestions} questions answered!</p>
          
          <button
            onClick={viewFinalResults}
            className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 mb-4"
          >
            📊 View Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-orange-500/30 shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🧠</span>
              Trivia Challenge
            </h2>
            <p className="text-orange-300">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div className="text-right">
            <div className="text-orange-300 text-sm mb-1">Current Scores</div>
            <div className="flex gap-4">
              <div className={`px-4 py-2 rounded-xl ${playerId === room.players[0]?.id ? 'bg-orange-500/30' : 'bg-white/5'}`}>
                <div className="text-white/70 text-xs">{room.players[0]?.name}</div>
                <div className="text-white font-bold text-lg">{scores?.[room.players[0]?.id] || 0}</div>
              </div>
              <div className={`px-4 py-2 rounded-xl ${playerId === room.players[1]?.id ? 'bg-orange-500/30' : 'bg-white/5'}`}>
                <div className="text-white/70 text-xs">{room.players[1]?.name}</div>
                <div className="text-white font-bold text-lg">{scores?.[room.players[1]?.id] || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Badge */}
        <div className="mb-6 text-center">
          <span className="inline-block bg-gradient-to-r from-orange-600 to-red-600 px-6 py-2 rounded-full text-white font-semibold text-sm">
            📚 {currentQuestion.category}
          </span>
        </div>

        {/* Question */}
        <div className="mb-8 p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/30">
          <h3 className="text-white text-2xl font-bold text-center">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {currentQuestion.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={hasAnswered}
              className={`p-6 rounded-2xl border-2 border-white/10 transition-all transform hover:scale-105 ${
                getOptionColor(option)
              } ${hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                selectedAnswer === option ? 'ring-4 ring-orange-400' : ''
              }`}
            >
              <div className="text-white font-semibold text-lg text-left flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                  {String.fromCharCode(65 + index)}
                </div>
                {option}
              </div>
              
              {bothAnswered && option === currentQuestion.correctAnswer && (
                <div className="mt-2 text-green-400 font-bold text-sm">✓ Correct Answer</div>
              )}
            </button>
          ))}
        </div>

        {/* Who answered what */}
        {bothAnswered && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <div className="grid grid-cols-2 gap-4 text-center">
              {room.players.map(player => (
                <div key={player.id}>
                  <div className="text-white/70 text-sm mb-1">{player.name}</div>
                  <div className={`font-semibold ${answers[player.id] === currentQuestion.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                    {answers[player.id] === currentQuestion.correctAnswer ? '✓ Correct' : '✗ Wrong'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          {!hasAnswered && (
            <p className="text-orange-300 text-lg">🤔 Choose your answer!</p>
          )}
          {hasAnswered && !bothAnswered && (
            <p className="text-yellow-300 text-lg">⏳ Waiting for {otherPlayer?.name}...</p>
          )}
          {bothAnswered && !gameOver && (
            <div className="space-y-3">
              {!isHost && (
                <p className="text-white/60 text-sm">👑 Waiting for host...</p>
              )}
              <button
                onClick={nextQuestion}
                disabled={!isHost}
                className={`bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all ${
                  isHost 
                    ? 'hover:from-orange-700 hover:to-red-700 transform hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isHost ? '▶️ Next Question' : '⏳ Waiting for host...'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Final Results Modal */}
      {showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 rounded-3xl border border-orange-500/30 p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">🏆 Final Results</h2>
            
            <div className="space-y-4 mb-6">
              <div className={`p-6 rounded-2xl ${myScore > opponentScore ? 'bg-green-500/20 border-2 border-green-500/50' : myScore < opponentScore ? 'bg-red-500/20 border-2 border-red-500/50' : 'bg-yellow-500/20 border-2 border-yellow-500/50'}`}>
                <div className="text-center mb-2">
                  <div className="text-5xl mb-2">
                    {myScore > opponentScore ? '🥇' : myScore < opponentScore ? '🥈' : '🤝'}
                  </div>
                  <div className="text-white font-bold text-xl mb-1">
                    {room.players.find(p => p.id === playerId)?.name}
                  </div>
                  <div className="text-4xl font-bold text-white">{myScore} pts</div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl ${opponentScore > myScore ? 'bg-green-500/20 border-2 border-green-500/50' : opponentScore < myScore ? 'bg-red-500/20 border-2 border-red-500/50' : 'bg-yellow-500/20 border-2 border-yellow-500/50'}`}>
                <div className="text-center mb-2">
                  <div className="text-5xl mb-2">
                    {opponentScore > myScore ? '🥇' : opponentScore < myScore ? '🥈' : '🤝'}
                  </div>
                  <div className="text-white font-bold text-xl mb-1">{otherPlayer?.name}</div>
                  <div className="text-4xl font-bold text-white">{opponentScore} pts</div>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-white mb-2">
                {myScore > opponentScore ? '🎉 You Won!' : myScore < opponentScore ? '😢 You Lost' : '🤝 It\'s a Tie!'}
              </div>
              <div className="text-white/60">Great game!</div>
            </div>

            <div className="space-y-3">
              {!isHost && (
                <p className="text-white/60 text-sm text-center">👑 Waiting for host...</p>
              )}
              <button
                onClick={playAgain}
                disabled={!isHost}
                className={`w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all ${
                  isHost 
                    ? 'hover:from-orange-700 hover:to-red-700 transform hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isHost ? '🔄 Play Again' : '⏳ Waiting for host...'}
              </button>
              <button
                onClick={closeFinalResults}
                className="w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/20 transition-all"
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