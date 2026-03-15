import { IQuestion } from '../models/Quiz';

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
  }
}

export const gameStore = new GameStore();
