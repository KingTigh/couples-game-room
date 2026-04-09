// @ts-nocheck
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Changed for deployment
const port = process.env.PORT || 3000; // Use Render's PORT

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory storage
const rooms = new Map();
const gameStates = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create-room', (playerName, callback) => {
      const roomCode = nanoid(6).toUpperCase();
      const roomId = nanoid();
      
      const player = {
        id: socket.id,
        name: playerName,
        isOnline: true,
        isHost: true,
      };

      const room = {
        id: roomId,
        code: roomCode,
        createdAt: Date.now(),
        players: [player],
        maxPlayers: 2,
        hostId: socket.id,
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);

      callback({ success: true, room, playerId: socket.id });
      console.log(`Room created: ${roomCode}`);
    });

    socket.on('join-room', (roomCode, playerName, callback) => {
      const room = rooms.get(roomCode);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      const player = {
        id: socket.id,
        name: playerName,
        isOnline: true,
        isHost: false,
      };

      room.players.push(player);
      socket.join(roomCode);

      socket.to(roomCode).emit('player-joined', player);
      callback({ success: true, room, playerId: socket.id });
      console.log(`Player joined room: ${roomCode}`);
    });

    socket.on('start-game', (roomCode, gameType, playMode) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      // Only host can start game
      if (socket.id !== room.hostId) {
        console.log('Non-host tried to start game');
        return;
      }

      room.currentGame = gameType;
      room.playMode = playMode;

      const gameState = {
        gameType,
        playMode,
        currentTurn: room.players[0].id,
        status: 'playing',
        data: initializeGameData(gameType, room.players),
      };

    socket.on('restart-game', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const gameType = room.currentGame;
        const playMode = room.playMode;

        if (!gameType || !playMode) return;

        const gameState = {
          gameType,
          playMode,
          currentTurn: room.players[0].id,
          status: 'playing',
          data: initializeGameData(gameType, room.players),
        };

        gameStates.set(roomCode, gameState);
        io.to(roomCode).emit('game-started', gameState);
        console.log(`Game restarted in room ${roomCode}: ${gameType}`);
      });

      gameStates.set(roomCode, gameState);
      io.to(roomCode).emit('game-started', gameState);
      console.log(`Game started in room ${roomCode}: ${gameType}`);
    });

    socket.on('end-game', (roomCode) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      // Only host can end game
      if (socket.id !== room.hostId) {
        console.log('Non-host tried to end game');
        return;
      }

      // Clear game state
      gameStates.delete(roomCode);
      
      // Notify all players to return to lobby
      io.to(roomCode).emit('game-ended');
      console.log(`Game ended in room ${roomCode} by host`);
    });

    socket.on('game-move', (roomCode, moveData) => {
      const gameState = gameStates.get(roomCode);
      const room = rooms.get(roomCode);
      if (!gameState || !room) return;

      updateGameState(gameState, moveData, room);
      io.to(roomCode).emit('game-updated', gameState);

      // Check if game finished
      if (gameState.status === 'finished') {
        const score = {
          gameType: gameState.gameType,
          winner: gameState.winner,
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            score: gameState.data.scores?.[p.id] || 0,
          })),
          timestamp: Date.now(),
        };
        
        io.to(roomCode).emit('game-finished', { gameState, score });
        console.log(`Game finished in room ${roomCode}. Winner:`, gameState.winner);
      }
    });

    socket.on('send-message', (roomCode, message, playerName) => {
      io.to(roomCode).emit('chat-message', {
        playerId: socket.id,
        playerName,
        message,
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      rooms.forEach((room, code) => {
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.isOnline = false;
          socket.to(code).emit('player-disconnected', player.id);
        }
      });
    });
  });

  // Timer countdown system
  setInterval(() => {
    gameStates.forEach((gameState, roomCode) => {
      if (gameState.status === 'playing' && gameState.gameType === 'drawing') {
        if (gameState.data.timeLeft > 0 && !gameState.data.isCorrect) {
          gameState.data.timeLeft -= 1;
          
          // Emit updated game state
          io.to(roomCode).emit('game-updated', gameState);
          
          // Time's up
          if (gameState.data.timeLeft === 0) {
            gameState.data.isCorrect = true; // Force round end
          }
        }
      }
    });
  }, 1000);

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

function initializeGameData(gameType, players) {
  switch (gameType) {
    case 'tic-tac-toe':
      return {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        isDraw: false,
      };
      
    case 'drawing':
      // Randomly assign drawer and guesser
      const drawerIndex = Math.floor(Math.random() * 2);
      return {
        prompt: getRandomDrawingPrompt(),
        drawer: players[drawerIndex].id,
        guesser: players[1 - drawerIndex].id,
        drawing: [],
        guesses: [],
        isCorrect: false,
        timeLeft: 120,
        scores: {
          [players[0].id]: 0,
          [players[1].id]: 0,
        },
        round: 1,
        maxRounds: 6,
      };
      
    case 'trivia':
      return {
        questions: getSampleTriviaQuestions(),
        currentQuestionIndex: 0,
        scores: {
          [players[0].id]: 0,
          [players[1].id]: 0,
        },
        answers: {},
      };
      
    case 'would-you-rather':
      return {
        questions: shuffleArray(getAllWouldYouRatherQuestions()),
        currentQuestionIndex: 0,
        answers: {},
        revealed: false,
      };
          
    default:
      return {};
  }
}

function updateGameState(gameState, moveData, room) {
  switch (gameState.gameType) {
    case 'tic-tac-toe':
      if (moveData.position !== undefined) {
        gameState.data.board[moveData.position] = gameState.data.currentPlayer;
        
        // Check for winner BEFORE switching players
        const winner = checkTicTacToeWinner(gameState.data.board);
        if (winner) {
          gameState.data.winner = winner;
          gameState.status = 'finished';
          gameState.winner = winner === 'X' ? room.players[0].id : room.players[1].id;
          console.log(`Tic-Tac-Toe winner: ${winner}, Player: ${gameState.winner}`);
        } else if (!gameState.data.board.includes(null)) {
          gameState.data.isDraw = true;
          gameState.status = 'finished';
          gameState.winner = null;
          console.log('Tic-Tac-Toe ended in a draw');
        } else {
          // Only switch player if game continues
          gameState.data.currentPlayer = gameState.data.currentPlayer === 'X' ? 'O' : 'X';
        }
      }
      break;
    
case 'drawing':
  if (moveData.type === 'draw') {
    gameState.data.drawing.push(moveData.path);
} else if (moveData.type === 'guess') {
  gameState.data.guesses.push(moveData.guess);
  
  const guessLower = moveData.guess.toLowerCase().trim();
  const promptLower = gameState.data.prompt.toLowerCase().trim();
  
  // Exact match only - no partial matches
  if (guessLower === promptLower) {
    gameState.data.isCorrect = true;
    
    // Award points based on number of guesses (fewer guesses = more points)
    if (gameState.data.scores && moveData.playerId) {
      const guessCount = gameState.data.guesses.length;
      let guesserPoints = 10; // Base points
      
      // Bonus points for fewer guesses
      if (guessCount === 1) {
        guesserPoints = 20; // First try bonus!
      } else if (guessCount === 2) {
        guesserPoints = 15; // Second try
      } else if (guessCount === 3) {
        guesserPoints = 12; // Third try
      } else if (guessCount <= 5) {
        guesserPoints = 10; // 4-5 tries
      } else {
        guesserPoints = 8; // More than 5 tries
      }
      
      // Award points
      gameState.data.scores[moveData.playerId] = (gameState.data.scores[moveData.playerId] || 0) + guesserPoints;
      gameState.data.scores[gameState.data.drawer] = (gameState.data.scores[gameState.data.drawer] || 0) + 5; // Drawer always gets 5
      
      // Store the guess count for display
      gameState.data.guessCount = guessCount;
      gameState.data.pointsEarned = guesserPoints;
    }
  }
} else if (moveData.type === 'clear') {
    gameState.data.drawing = [];
  } else if (moveData.type === 'next-round') {
    gameState.data.round += 1;
    
    if (gameState.data.round > gameState.data.maxRounds) {
      gameState.status = 'finished';
      const player1Score = gameState.data.scores[room.players[0].id] || 0;
      const player2Score = gameState.data.scores[room.players[1].id] || 0;
      
      if (player1Score > player2Score) {
        gameState.winner = room.players[0].id;
      } else if (player2Score > player1Score) {
        gameState.winner = room.players[1].id;
      } else {
        gameState.winner = null;
      }
    } else {
      const currentDrawer = gameState.data.drawer;
      const currentGuesser = gameState.data.guesser;
      
      gameState.data.drawer = currentGuesser;
      gameState.data.guesser = currentDrawer;
      gameState.data.prompt = getRandomDrawingPrompt();
      gameState.data.drawing = [];
      gameState.data.guesses = [];
      gameState.data.isCorrect = false;
      gameState.data.timeLeft = 120;
    }
  }
  break;

case 'would-you-rather':
  if (moveData.answer) {
    gameState.data.answers[moveData.playerId] = moveData.answer;
    if (Object.keys(gameState.data.answers).length >= 2) {
      gameState.data.revealed = true;
    }
  } else if (moveData.type === 'next-question') {
    gameState.data.currentQuestionIndex++;
    
    if (gameState.data.currentQuestionIndex >= gameState.data.questions.length) {
      // Game over - all questions answered
      gameState.status = 'finished';
      gameState.winner = null; // No winner in Would You Rather, it's just for fun
    } else {
      // Move to next question
      gameState.data.answers = {};
      gameState.data.revealed = false;
    }
  }
  break;

case 'trivia':
  if (moveData.answer) {
    const currentQ = gameState.data.questions[gameState.data.currentQuestionIndex];
    gameState.data.answers[moveData.playerId] = moveData.answer;
    
    if (moveData.answer === currentQ.correctAnswer) {
      gameState.data.scores[moveData.playerId] = (gameState.data.scores[moveData.playerId] || 0) + 10;
    }
  } else if (moveData.type === 'next-question') {
    gameState.data.currentQuestionIndex++;
    gameState.data.answers = {};
    
    if (gameState.data.currentQuestionIndex >= gameState.data.questions.length) {
      gameState.status = 'finished';
      const player1Score = gameState.data.scores[room.players[0].id] || 0;
      const player2Score = gameState.data.scores[room.players[1].id] || 0;
      
      if (player1Score > player2Score) {
        gameState.winner = room.players[0].id;
      } else if (player2Score > player1Score) {
        gameState.winner = room.players[1].id;
      } else {
        gameState.winner = null;
      }
    }
  }
  break;
  }
}

function checkTicTacToeWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function getRandomDrawingPrompt() {
  const prompts = [
    'cat', 'dog', 'house', 'tree', 'car', 'flower', 'sun', 'heart', 
    'star', 'boat', 'airplane', 'pizza', 'cake', 'umbrella', 'glasses', 
    'phone', 'computer', 'book', 'shoe', 'hat'
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function getSampleTriviaQuestions() {
  const allQuestions = [
    {
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      category: 'Geography',
    },
    {
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 'Mars',
      category: 'Science',
    },
    {
      question: 'Who painted the Mona Lisa?',
      options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Monet'],
      correctAnswer: 'Da Vinci',
      category: 'Art',
    },
    {
      question: 'What is the largest ocean on Earth?',
      options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
      correctAnswer: 'Pacific',
      category: 'Geography',
    },
    {
      question: 'How many sides does a hexagon have?',
      options: ['5', '6', '7', '8'],
      correctAnswer: '6',
      category: 'Math',
    },
    {
      question: 'What is the smallest country in the world?',
      options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
      correctAnswer: 'Vatican City',
      category: 'Geography',
    },
    {
      question: 'Who wrote "Romeo and Juliet"?',
      options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
      correctAnswer: 'William Shakespeare',
      category: 'Literature',
    },
    {
      question: 'What is the chemical symbol for gold?',
      options: ['Go', 'Gd', 'Au', 'Ag'],
      correctAnswer: 'Au',
      category: 'Science',
    },
    {
      question: 'In which year did World War II end?',
      options: ['1943', '1944', '1945', '1946'],
      correctAnswer: '1945',
      category: 'History',
    },
    {
      question: 'What is the fastest land animal?',
      options: ['Lion', 'Cheetah', 'Leopard', 'Gazelle'],
      correctAnswer: 'Cheetah',
      category: 'Nature',
    },
  ];
  
  return shuffleArray(allQuestions);
}

function getAllWouldYouRatherQuestions() {
  return [
    { question: 'Would you rather...', optionA: 'Travel to the past', optionB: 'Travel to the future' },
    { question: 'Would you rather...', optionA: 'Have telepathy', optionB: 'Have telekinesis' },
    { question: 'Would you rather...', optionA: 'Always be 10 minutes late', optionB: 'Always be 20 minutes early' },
    { question: 'Would you rather...', optionA: 'Live without music', optionB: 'Live without movies' },
    { question: 'Would you rather...', optionA: 'Be able to fly', optionB: 'Be invisible' },
    { question: 'Would you rather...', optionA: 'Never use social media again', optionB: 'Never watch TV/movies again' },
    { question: 'Would you rather...', optionA: 'Have unlimited money', optionB: 'Have unlimited time' },
    { question: 'Would you rather...', optionA: 'Live in a world without problems', optionB: 'Live in a world where you solve all problems' },
    { question: 'Would you rather...', optionA: 'Be famous but poor', optionB: 'Be rich but unknown' },
    { question: 'Would you rather...', optionA: 'Explore space', optionB: 'Explore the ocean depths' },
  ];
}