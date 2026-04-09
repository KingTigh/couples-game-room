import { create } from 'zustand';
import { Room, Player, GameState } from '../types/game';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

interface GameScore {
  gameType: string;
  winner: string | null;
  players: { id: string; name: string; score?: number }[];
  timestamp: number;
}

interface GameStore {
  room: Room | null;
  playerId: string | null;
  gameState: GameState | null;
  messages: ChatMessage[];
  scores: GameScore[];
  soundEnabled: boolean;
  
  setRoom: (room: Room) => void;
  setPlayerId: (id: string) => void;
  setGameState: (state: GameState | null) => void;
  addMessage: (message: ChatMessage) => void;
  addScore: (score: GameScore) => void;
  updatePlayerStatus: (playerId: string, isOnline: boolean) => void;
  addPlayer: (player: Player) => void;
  toggleSound: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  playerId: null,
  gameState: null,
  messages: [],
  scores: [],
  soundEnabled: true,

  setRoom: (room) => set({ room }),
  
  setPlayerId: (id) => set({ playerId: id }),
  
  setGameState: (state) => set({ gameState: state }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  addScore: (score) => set((state) => ({
    scores: [...state.scores, score],
  })),
  
  updatePlayerStatus: (playerId, isOnline) => set((state) => {
    if (!state.room) return state;
    
    const updatedPlayers = state.room.players.map((p) =>
      p.id === playerId ? { ...p, isOnline } : p
    );
    
    return {
      room: { ...state.room, players: updatedPlayers },
    };
  }),
  
  addPlayer: (player) => set((state) => {
    if (!state.room) return state;
    
    return {
      room: {
        ...state.room,
        players: [...state.room.players, player],
      },
    };
  }),
  
  toggleSound: () => set((state) => ({
    soundEnabled: !state.soundEnabled,
  })),
  
  reset: () => set({
    room: null,
    playerId: null,
    gameState: null,
    messages: [],
  }),
}));