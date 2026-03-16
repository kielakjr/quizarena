import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { gameStore, type GameSession } from './GameStore';
import type { AuthPayload } from '../middleware/auth';
import { Quiz } from '../models/Quiz';

function getPlayerList(game: GameSession): { nickname: string; score: number }[] {
  return Array.from(game.players.values()).map((p) => ({
    nickname: p.nickname,
    score: p.score,
  }));
}

function getLeaderboard(game: GameSession): { nickname: string; score: number; streak: number }[] {
  return Array.from(game.players.values())
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ nickname: p.nickname, score: p.score, streak: p.streak }));
}

function sendQuestion(io: Server, game: GameSession) {
  const q = game.quiz.questions[game.currentQuestionIndex];
  game.questionStartedAt = Date.now();
  game.playerAnswers.clear();
  game.status = 'playing';

  io.to(game.pin).emit('question:show', {
    index: game.currentQuestionIndex,
    text: q.text,
    imageUrl: q.imageUrl || null,
    options: q.options.map((o) => ({ _id: o._id.toString(), text: o.text })),
    timeLimit: q.timeLimit,
    points: q.points,
    total: game.quiz.questions.length,
  });

  game.questionTimer = setTimeout(() => {
    resolveQuestion(io, game);
  }, q.timeLimit * 1000);
}

function resolveQuestion(io: Server, game: GameSession) {
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = null;
  }

  const q = game.quiz.questions[game.currentQuestionIndex];
  const correctIndex = q.options.findIndex((o) => o.isCorrect);
  const distribution = new Array(q.options.length).fill(0);

  game.playerAnswers.forEach((answer) => {
    distribution[answer.optionIndex]++;
  });

  game.status = 'results';
  gameStore.persist(game);

  for (const [socketId, player] of game.players) {
    const answer = game.playerAnswers.get(socketId);
    const correct = answer?.optionIndex === correctIndex;
    let pointsEarned = 0;

    if (correct && game.questionStartedAt && answer) {
      const timeTaken = (answer.answeredAt - game.questionStartedAt) / 1000;
      pointsEarned = Math.round(q.points * (1 - (timeTaken / q.timeLimit) * 0.5));
      pointsEarned = Math.max(Math.round(q.points * 0.5), pointsEarned);
      player.score += pointsEarned;
      player.streak += 1;
    } else {
      player.streak = 0;
    }

    io.to(socketId).emit('question:results', {
      correctIndex,
      distribution,
      correct,
      pointsEarned,
      totalScore: player.score,
      streak: player.streak,
    });
  }

  if (game.hostSocketId) {
    io.to(game.hostSocketId).emit('question:results', {
      correctIndex,
      distribution,
    });
  }
}

export function registerGameHandlers(io: Server, socket: Socket) {
  socket.on('host:join', ({ pin, token }: { pin: string; token: string }) => {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
      const game = gameStore.getGame(pin);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.hostUserId !== decoded.userId) {
        socket.emit('error', { message: 'Not authorized to host this game' });
        return;
      }

      game.hostSocketId = socket.id;
      socket.join(pin);
      socket.data.role = 'host';
      socket.data.pin = pin;

      socket.emit('player:joined', {
        players: getPlayerList(game),
      });
    } catch {
      socket.emit('error', { message: 'Invalid token' });
    }
  });

  socket.on('player:join', ({ pin, nickname }: { pin: string; nickname: string }) => {
    const game = gameStore.getGame(pin);

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.status !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    const nicknameTaken = Array.from(game.players.values()).some(
      (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
    );

    if (nicknameTaken) {
      socket.emit('error', { message: 'Nickname already taken' });
      return;
    }

    game.players.set(socket.id, { nickname, score: 0, streak: 0 });
    socket.join(pin);
    socket.data.role = 'player';
    socket.data.pin = pin;
    socket.data.nickname = nickname;
    gameStore.persist(game);

    io.to(pin).emit('player:joined', {
      nickname,
      players: getPlayerList(game),
    });
  });

  socket.on('game:start', ({ pin }: { pin: string }) => {
    const game = gameStore.getGame(pin);

    if (!game || game.hostSocketId !== socket.id) {
      socket.emit('error', { message: 'Not authorized' });
      return;
    }

    if (game.players.size === 0) {
      socket.emit('error', { message: 'No players have joined' });
      return;
    }

    game.currentQuestionIndex = 0;
    gameStore.persist(game);
    Quiz.findByIdAndUpdate(game.quizId, { $inc: { timesPlayed: 1 } }).catch(() => {});
    io.to(pin).emit('game:countdown', { seconds: 3 });
    setTimeout(() => {
      io.to(pin).emit('game:started', {});
      sendQuestion(io, game);
    }, 3000);
  });

  socket.on('question:answer', ({ pin, optionIndex }: { pin: string; optionIndex: number }) => {
    const game = gameStore.getGame(pin);

    if (!game || game.status !== 'playing') return;
    if (!game.players.has(socket.id)) return;
    if (game.playerAnswers.has(socket.id)) return;

    game.playerAnswers.set(socket.id, { optionIndex, answeredAt: Date.now() });

    if (game.hostSocketId) {
      io.to(game.hostSocketId).emit('question:answered', {
        answeredCount: game.playerAnswers.size,
        totalPlayers: game.players.size,
      });
    }

    if (game.playerAnswers.size >= game.players.size) {
      resolveQuestion(io, game);
    }
  });

  socket.on('host:next', ({ pin }: { pin: string }) => {
    const game = gameStore.getGame(pin);

    if (!game || game.hostSocketId !== socket.id) return;

    game.currentQuestionIndex += 1;

    if (game.currentQuestionIndex >= game.quiz.questions.length) {
      const leaderboard = getLeaderboard(game);
      game.status = 'finished';
      gameStore.persist(game);
      io.to(pin).emit('game:ended', { leaderboard });
      gameStore.removeGame(pin);
    } else {
      const leaderboard = getLeaderboard(game);
      const isGameOver = false;
      game.status = 'leaderboard';
      gameStore.persist(game);
      io.to(pin).emit('game:leaderboard', { leaderboard, isGameOver });
    }
  });

  socket.on('host:nextQuestion', ({ pin }: { pin: string }) => {
    const game = gameStore.getGame(pin);

    if (!game || game.hostSocketId !== socket.id) return;
    if (game.status !== 'leaderboard') return;

    const count = 3000;

    io.to(pin).emit('question:countdown', { seconds: count / 1000 });
    setTimeout(() => {
      sendQuestion(io, game);
    }, count);
  });

  socket.on('disconnect', () => {
    const pin = socket.data.pin as string | undefined;
    if (!pin) return;

    const game = gameStore.getGame(pin);
    if (!game) return;

    if (socket.data.role === 'host') {
      game.status = 'finished';
      io.to(pin).emit('game:ended', { leaderboard: getLeaderboard(game) });
      gameStore.removeGame(pin);
    } else if (socket.data.role === 'player') {
      const player = game.players.get(socket.id);
      game.players.delete(socket.id);
      game.playerAnswers.delete(socket.id);
      gameStore.persist(game);

      io.to(pin).emit('player:left', {
        nickname: player?.nickname,
        players: getPlayerList(game),
      });

      if (
        game.status === 'playing' &&
        game.players.size > 0 &&
        game.playerAnswers.size >= game.players.size
      ) {
        resolveQuestion(io, game);
      }
    }
  });
}
