'use client';

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';
import { soundManager } from '../../lib/sounds';

export default function WouldYouRather() {
  const { room, playerId, gameState } = useGameStore();
  const { makeMove, restartGame } = useSocket();
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | null>(null);

  if (!gameState || !room) return null;

  const isHost = room.hostId === playerId;
  const { questions, currentQuestionIndex, answers, revealed } = gameState.data;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const hasAnswered = answers[playerId!];
  const otherPlayer = room.players.find(p => p.id !== playerId);
  const otherPlayerAnswer = otherPlayer ? answers[otherPlayer.id] : null;
  const gameOver = currentQuestionIndex >= totalQuestions;

  const handleAnswer = (answer: 'A' | 'B') => {
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

  const playAgain = () => {
    if (!room || !isHost) return;
    soundManager.play('gameStart');
    restartGame(room.code);
  };

  const getColor = (option: 'A' | 'B') => {
    if (option === 'A') return 'from-emerald-500 to-green-500';
    return 'from-teal-500 to-cyan-500';
  };

  const getBorderColor = (option: 'A' | 'B') => {
    if (option === 'A') return 'border-emerald-400';
    return 'border-teal-400';
  };

  const countVotes = (option: 'A' | 'B') => {
    return Object.values(answers).filter(a => a === option).length;
  };

  if (gameOver) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-green-500/30 shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-2">Game Complete!</h2>
          <p className="text-green-300 text-lg mb-6">You've answered all {totalQuestions} questions!</p>
          
          <div className="space-y-3">
            {!isHost && (
              <p className="text-white/60 text-sm">👑 Waiting for host...</p>
            )}
            <button
              onClick={playAgain}
              disabled={!isHost}
              className={`w-full max-w-md mx-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition-all ${
                isHost 
                  ? 'hover:from-green-700 hover:to-emerald-700 transform hover:scale-105' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {isHost ? '🔄 Play Again' : '⏳ Waiting for host...'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-green-500/30 shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span>🤔</span> Would You Rather?
          </h2>
          <p className="text-green-300 text-lg">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Question */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Option A */}
          <button
            onClick={() => handleAnswer('A')}
            disabled={hasAnswered}
            className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
              hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'
            } ${selectedAnswer === 'A' ? `ring-4 ${getBorderColor('A')} scale-105` : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${getColor('A')} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative z-10">
              <div className="text-7xl mb-4">🅰️</div>
              <p className="text-white text-2xl font-bold mb-2">{currentQuestion.optionA}</p>
              
              {revealed && (
                <div className="mt-6 pt-4 border-t border-white/30">
                  <div className="text-white/80 text-sm mb-2">
                    {countVotes('A')} {countVotes('A') === 1 ? 'vote' : 'votes'}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {room.players.map(player => 
                      answers[player.id] === 'A' && (
                        <span key={player.id} className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                          {player.name} {player.id === playerId && '(you)'}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Option B */}
          <button
            onClick={() => handleAnswer('B')}
            disabled={hasAnswered}
            className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
              hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'
            } ${selectedAnswer === 'B' ? `ring-4 ${getBorderColor('B')} scale-105` : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${getColor('B')} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative z-10">
              <div className="text-7xl mb-4">🅱️</div>
              <p className="text-white text-2xl font-bold mb-2">{currentQuestion.optionB}</p>
              
              {revealed && (
                <div className="mt-6 pt-4 border-t border-white/30">
                  <div className="text-white/80 text-sm mb-2">
                    {countVotes('B')} {countVotes('B') === 1 ? 'vote' : 'votes'}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {room.players.map(player => 
                      answers[player.id] === 'B' && (
                        <span key={player.id} className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                          {player.name} {player.id === playerId && '(you)'}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Status */}
        <div className="text-center">
          {!hasAnswered && (
            <p className="text-green-300 text-lg">✨ Make your choice!</p>
          )}
          {hasAnswered && !revealed && (
            <p className="text-yellow-300 text-lg">⏳ Waiting for {otherPlayer?.name}...</p>
          )}
          {revealed && (
            <div className="space-y-3">
              {!isHost && (
                <p className="text-white/60 text-sm">👑 Waiting for host to continue...</p>
              )}
              <button
                onClick={nextQuestion}
                disabled={!isHost}
                className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition-all ${
                  isHost 
                    ? 'hover:from-green-700 hover:to-emerald-700 transform hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isHost ? '▶️ Next Question' : '⏳ Waiting for host...'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}