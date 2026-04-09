// @ts-nocheck
// Deployed version with PostgreSQL support
require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms = new Map();
const gameStates = new Map();

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

      gameStates.set(roomCode, gameState);
      io.to(roomCode).emit('game-started', gameState);
      console.log(`Game started in room ${roomCode}: ${gameType}`);
    });

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

    socket.on('end-game', (roomCode) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      if (socket.id !== room.hostId) {
        console.log('Non-host tried to end game');
        return;
      }

      gameStates.delete(roomCode);
      
      io.to(roomCode).emit('game-ended');
      console.log(`Game ended in room ${roomCode} by host`);
    });

    socket.on('game-move', (roomCode, moveData) => {
      const gameState = gameStates.get(roomCode);
      const room = rooms.get(roomCode);
      if (!gameState || !room) return;

      updateGameState(gameState, moveData, room);
      io.to(roomCode).emit('game-updated', gameState);

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

  setInterval(() => {
    gameStates.forEach((gameState, roomCode) => {
      if (gameState.status === 'playing' && gameState.gameType === 'drawing') {
        if (gameState.data.timeLeft > 0 && !gameState.data.isCorrect) {
          gameState.data.timeLeft -= 1;
          
          io.to(roomCode).emit('game-updated', gameState);
          
          if (gameState.data.timeLeft === 0) {
            gameState.data.isCorrect = true;
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
        
        if (guessLower === promptLower) {
          gameState.data.isCorrect = true;
          
          if (gameState.data.scores && moveData.playerId) {
            const guessCount = gameState.data.guesses.length;
            let guesserPoints = 10;
            
            if (guessCount === 1) {
              guesserPoints = 20;
            } else if (guessCount === 2) {
              guesserPoints = 15;
            } else if (guessCount === 3) {
              guesserPoints = 12;
            } else if (guessCount <= 5) {
              guesserPoints = 10;
            } else {
              guesserPoints = 8;
            }
            
            gameState.data.scores[moveData.playerId] = (gameState.data.scores[moveData.playerId] || 0) + guesserPoints;
            gameState.data.scores[gameState.data.drawer] = (gameState.data.scores[gameState.data.drawer] || 0) + 5;
            
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
          gameState.status = 'finished';
          gameState.winner = null;
        } else {
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
    {
      question: 'How many continents are there?',
      options: ['5', '6', '7', '8'],
      correctAnswer: '7',
      category: 'Geography',
    },
    {
      question: 'What is the tallest mountain in the world?',
      options: ['K2', 'Mount Everest', 'Kilimanjaro', 'Denali'],
      correctAnswer: 'Mount Everest',
      category: 'Geography',
    },
    {
      question: 'What is the speed of light?',
      options: ['299,792 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'],
      correctAnswer: '299,792 km/s',
      category: 'Science',
    },
    {
      question: 'Who invented the telephone?',
      options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Benjamin Franklin'],
      correctAnswer: 'Alexander Graham Bell',
      category: 'History',
    },
    {
      question: 'What is the largest organ in the human body?',
      options: ['Heart', 'Brain', 'Liver', 'Skin'],
      correctAnswer: 'Skin',
      category: 'Science',
    },
    {
      question: 'How many bones are in the adult human body?',
      options: ['186', '206', '226', '246'],
      correctAnswer: '206',
      category: 'Science',
    },
    {
      question: 'What year did the Titanic sink?',
      options: ['1910', '1912', '1914', '1916'],
      correctAnswer: '1912',
      category: 'History',
    },
    {
      question: 'What is the currency of Japan?',
      options: ['Yuan', 'Won', 'Yen', 'Ringgit'],
      correctAnswer: 'Yen',
      category: 'Geography',
    },
    {
      question: 'How many players are on a soccer team?',
      options: ['9', '10', '11', '12'],
      correctAnswer: '11',
      category: 'Sports',
    },
    {
      question: 'What is the boiling point of water in Celsius?',
      options: ['90°C', '100°C', '110°C', '120°C'],
      correctAnswer: '100°C',
      category: 'Science',
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
    { question: 'Would you rather...', optionA: 'Always say what you think', optionB: 'Never speak again' },
    { question: 'Would you rather...', optionA: 'Have a rewind button', optionB: 'Have a pause button for your life' },
    { question: 'Would you rather...', optionA: 'Live without heating', optionB: 'Live without air conditioning' },
    { question: 'Would you rather...', optionA: 'Be the funniest person', optionB: 'Be the smartest person' },
    { question: 'Would you rather...', optionA: 'Find true love', optionB: 'Win the lottery' },
    { question: 'Would you rather...', optionA: 'Never have to sleep', optionB: 'Never have to eat' },
    { question: 'Would you rather...', optionA: 'Be able to talk to animals', optionB: 'Speak all human languages' },
    { question: 'Would you rather...', optionA: 'Live in the city', optionB: 'Live in the countryside' },
    { question: 'Would you rather...', optionA: 'Always be too hot', optionB: 'Always be too cold' },
    { question: 'Would you rather...', optionA: 'Have a personal chef', optionB: 'Have a personal chauffeur' },
  ];
}