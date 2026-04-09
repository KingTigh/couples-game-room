import { create } from 'zustand';
import { User, GameHistory } from '../types/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  gameHistory: GameHistory[];
  
  setUser: (user: User, token: string) => void;
  logout: () => void;
  addGameToHistory: (game: GameHistory) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  gameHistory: [],

  setUser: (user, token) => {
    set({ user, token });
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth', JSON.stringify({ user, token }));
    }
  },

  logout: () => {
    set({ user: null, token: null, gameHistory: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth');
    }
  },

  addGameToHistory: (game) => set((state) => ({
    gameHistory: [game, ...state.gameHistory],
  })),

  isAuthenticated: () => {
    const { user, token } = get();
    return !!(user && token);
  },
}));

// Load from localStorage on initialization
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('auth');
  if (stored) {
    try {
      const { user, token } = JSON.parse(stored);
      useAuthStore.setState({ user, token });
    } catch (e) {
      console.error('Failed to load auth from storage');
    }
  }
}