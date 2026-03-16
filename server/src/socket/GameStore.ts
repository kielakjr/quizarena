import { IQuestion } from '../models/Quiz';
import { GameSessionModel } from '../models/GameSession';

export interface Player {
  nickname: string;
  score: number;
  streak: number;
}

export interface GameSession {
  pin: string;
  quizId: string;
  hostSocketId: string;
  hostUserId: string;
  status: 'lobby' | 'playing' | 'results' | 'leaderboard' | 'finished';
  players: Map<string, Player>;
  quiz: {
    title: string;
    questions: IQuestion[];
  };
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  questionTimer: ReturnType<typeof setTimeout> | null;
  playerAnswers: Map<string, { optionIndex: number; answeredAt: number }>;
}

class GameStore {
  private games = new Map<string, GameSession>();

  generatePin(): string {
    let pin: string;
    do {
      pin = String(Math.floor(100000 + Math.random() * 900000));
    } while (this.games.has(pin));
    return pin;
  }

  createGame(pin: string, quizId: string, hostUserId: string, quiz: GameSession['quiz']): GameSession {
    const session: GameSession = {
      pin,
      quizId,
      hostSocketId: '',
      hostUserId,
      status: 'lobby',
      players: new Map(),
      quiz,
      currentQuestionIndex: 0,
      questionStartedAt: null,
      questionTimer: null,
      playerAnswers: new Map(),
    };
    this.games.set(pin, session);
    this.persist(session);
    return session;
  }

  getGame(pin: string): GameSession | undefined {
    return this.games.get(pin);
  }

  removeGame(pin: string): void {
    const game = this.games.get(pin);
    if (game?.questionTimer) {
      clearTimeout(game.questionTimer);
    }
    this.games.delete(pin);
    GameSessionModel.deleteOne({ pin }).catch((err) => {
      console.error('Failed to delete persisted game session:', err);
    });
  }

  persist(game: GameSession): void {
    const players = Array.from(game.players.values()).map((p) => ({
      nickname: p.nickname,
      score: p.score,
      streak: p.streak,
    }));

    GameSessionModel.findOneAndUpdate(
      { pin: game.pin },
      {
        pin: game.pin,
        quizId: game.quizId,
        hostUserId: game.hostUserId,
        status: game.status,
        players,
        quizTitle: game.quiz.title,
        quizQuestions: game.quiz.questions,
        currentQuestionIndex: game.currentQuestionIndex,
      },
      { upsert: true }
    ).catch((err) => {
      console.error('Failed to persist game session:', err);
    });
  }

  async restoreGames(): Promise<number> {
    const sessions = await GameSessionModel.find({
      status: { $in: ['lobby', 'playing', 'results', 'leaderboard'] },
    });

    for (const doc of sessions) {
      const status = doc.status === 'lobby' ? 'lobby' : 'lobby';

      const players = new Map<string, Player>();

      const session: GameSession = {
        pin: doc.pin,
        quizId: doc.quizId,
        hostSocketId: '',
        hostUserId: doc.hostUserId,
        status,
        players,
        quiz: {
          title: doc.quizTitle,
          questions: doc.quizQuestions as IQuestion[],
        },
        currentQuestionIndex: 0,
        questionStartedAt: null,
        questionTimer: null,
        playerAnswers: new Map(),
      };

      this.games.set(doc.pin, session);

      if (doc.status !== 'lobby') {
        doc.status = 'lobby';
        doc.currentQuestionIndex = 0;
        doc.players = [];
        await doc.save();
      }
    }

    return sessions.length;
  }
}

export const gameStore = new GameStore();
