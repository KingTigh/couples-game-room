export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

export interface GameHistory {
  id: string;
  userId: string;
  gameType: string;
  opponentName: string;
  opponentId?: string;
  myScore: number;
  opponentScore: number;
  result: 'win' | 'loss' | 'draw';
  playedAt: number;
  roomCode: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}