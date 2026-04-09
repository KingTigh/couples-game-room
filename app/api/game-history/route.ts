import { NextRequest, NextResponse } from 'next/server';
import { addGameHistory, getUserGameHistory } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Get user's game history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const history = getUserGameHistory(payload.userId);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// Add game to history
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const gameData = await request.json();

    const game = {
      id: gameData.id,
      userId: payload.userId,
      gameType: gameData.gameType,
      opponentName: gameData.opponentName,
      opponentId: gameData.opponentId,
      myScore: gameData.myScore,
      opponentScore: gameData.opponentScore,
      result: gameData.result,
      playedAt: gameData.playedAt,
      roomCode: gameData.roomCode,
    };

    addGameHistory(game);

    return NextResponse.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error('Add history error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}