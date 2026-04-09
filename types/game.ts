export type GameType = 'tic-tac-toe' | 'drawing' | 'trivia' | 'would-you-rather' | 'how-well-do-you-know-me';

export type PlayMode = 'real-time' | 'turn-based';

export interface Player {
  id: string;
  name: string;
  isOnline: boolean;
  avatar?: string;
   isHost?: boolean;  
}

export interface Room {
  id: string;
  code: string;
  createdAt: number;
  players: Player[];
  maxPlayers: number;
  currentGame?: GameType;
  playMode?: PlayMode;
  hostId?: string;  // ← Add this
}

export interface GameState {
  gameType: GameType;
  playMode: PlayMode;
  currentTurn: string; // player id
  status: 'waiting' | 'playing' | 'finished';
  winner?: string;
  data: any; // game-specific data
}

// Tic Tac Toe
export interface TicTacToeState {
  board: (string | null)[];
  currentPlayer: string;
  winner: string | null;
  isDraw: boolean;
}

// Drawing Challenge
export interface DrawingState {
  prompt: string;
  drawer: string;
  guesser: string;
  drawing: any[]; // drawing paths
  guesses: string[];
  isCorrect: boolean;
  timeLeft: number;
}

// Trivia
export interface TriviaState {
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  scores: Record<string, number>;
  answers: Record<string, string>;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  category: string;
}

// Would You Rather
export interface WouldYouRatherState {
  question: string;
  optionA: string;
  optionB: string;
  answers: Record<string, 'A' | 'B'>;
  revealed: boolean;
}

// How Well Do You Know Me
export interface HowWellState {
  questions: PersonalQuestion[];
  currentQuestionIndex: number;
  asker: string;
  answers: Record<string, any>;
  correctAnswers: Record<string, any>;
  score: number;
}

export interface PersonalQuestion {
  question: string;
  answer: string;
  options?: string[];
}