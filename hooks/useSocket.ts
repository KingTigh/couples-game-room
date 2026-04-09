'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { nanoid } from 'nanoid';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { setRoom, setPlayerId, setGameState, addMessage, updatePlayerStatus, addPlayer, addScore } = useGameStore();
  const { user, token, addGameToHistory } = useAuthStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!socket) {
      socket = io({
        path: '/api/socket',
      });

      socket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      socket.on('player-joined', (player) => {
        console.log('Player joined:', player);
        addPlayer(player);
      });

      socket.on('player-disconnected', (playerId) => {
        console.log('Player disconnected:', playerId);
        updatePlayerStatus(playerId, false);
      });

      socket.on('game-started', (gameState) => {
        console.log('Game started:', gameState);
        setGameState(gameState);
      });

      socket.on('game-updated', (gameState) => {
        console.log('Game updated:', gameState);
        setGameState(gameState);
      });

      socket.on('game-ended', () => {
        console.log('Game ended by host - returning to lobby');
        setGameState(null);
      });

      socket.on('game-finished', async (result) => {
        console.log('Game finished:', result);
        setGameState(result.gameState);
        addScore(result.score);

        // Save to game history if user is logged in
        if (user && token) {
          const room = useGameStore.getState().room;
          const playerId = useGameStore.getState().playerId;
          
          if (room && playerId) {
            const opponent = room.players.find(p => p.id !== playerId);
            const myScore = result.score.players.find((p: any) => p.id === playerId)?.score || 0;
            const opponentScore = result.score.players.find((p: any) => p.id !== playerId)?.score || 0;
            
            let gameResult: 'win' | 'loss' | 'draw' = 'draw';
            if (result.score.winner === playerId) {
              gameResult = 'win';
            } else if (result.score.winner && result.score.winner !== playerId) {
              gameResult = 'loss';
            }

            const gameHistory = {
              id: nanoid(),
              userId: user.id,
              gameType: result.gameState.gameType,
              opponentName: opponent?.name || 'Unknown',
              opponentId: opponent?.id,
              myScore,
              opponentScore,
              result: gameResult,
              playedAt: Date.now(),
              roomCode: room.code,
            };

            // Save to local state
            addGameToHistory(gameHistory);

            // Save to server
            try {
              await fetch('/api/game-history', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(gameHistory),
              });
            } catch (error) {
              console.error('Failed to save game history:', error);
            }
          }
        }
      });

      socket.on('chat-message', (message) => {
        console.log('Chat message:', message);
        addMessage({
          id: nanoid(),
          playerId: message.playerId,
          playerName: message.playerName,
          message: message.message,
          timestamp: message.timestamp,
        });
      });
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [isClient, setRoom, setPlayerId, setGameState, addMessage, updatePlayerStatus, addPlayer, addScore, user, token, addGameToHistory]);

  const createRoom = (playerName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('create-room', playerName, (response: any) => {
        if (response.success) {
          setRoom(response.room);
          setPlayerId(response.playerId);
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const joinRoom = (roomCode: string, playerName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('join-room', roomCode, playerName, (response: any) => {
        if (response.success) {
          setRoom(response.room);
          setPlayerId(response.playerId);
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const startGame = (roomCode: string, gameType: string, playMode: string) => {
    if (!socket) return;
    socket.emit('start-game', roomCode, gameType, playMode);
  };

  const makeMove = (roomCode: string, moveData: any) => {
    if (!socket) return;
    socket.emit('game-move', roomCode, moveData);
  };

  const sendMessage = (roomCode: string, message: string, playerName: string) => {
    if (!socket) return;
    socket.emit('send-message', roomCode, message, playerName);
  };

  const restartGame = (roomCode: string) => {
    if (!socket) return;
    socket.emit('restart-game', roomCode);
  };

  const endGame = (roomCode: string) => {
    if (!socket) return;
    socket.emit('end-game', roomCode);
  };

  return {
    isConnected,
    createRoom,
    joinRoom,
    startGame,
    makeMove,
    sendMessage,
    restartGame,
    endGame,
  };
}