import { useReducer, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export interface PlayerInfo {
  nickname: string;
  score: number;
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  streak: number;
}

export interface QuestionData {
  index: number;
  text: string;
  imageUrl: string | null;
  options: { _id: string; text: string }[];
  timeLimit: number;
  points: number;
  total: number;
}

export interface QuestionResults {
  correctIndex: number;
  distribution: number[];
  correct?: boolean;
  pointsEarned?: number;
  totalScore?: number;
  streak?: number;
}

export interface GameState {
  phase: 'connecting' | 'lobby' | 'countdown' | 'playing' | 'questionCountdown' | 'results' | 'leaderboard' | 'finished';
  players: PlayerInfo[];
  question: QuestionData | null;
  results: QuestionResults | null;
  leaderboard: LeaderboardEntry[];
  previousLeaderboard: LeaderboardEntry[];
  answeredCount: number;
  totalPlayers: number;
  answered: boolean;
  error: string | null;
  countdownSeconds: number;
}

type GameAction =
  | { type: 'PLAYER_JOINED'; players: PlayerInfo[] }
  | { type: 'PLAYER_LEFT'; players: PlayerInfo[] }
  | { type: 'GAME_COUNTDOWN'; seconds: number }
  | { type: 'GAME_STARTED' }
  | { type: 'QUESTION_COUNTDOWN'; seconds: number }
  | { type: 'QUESTION_SHOW'; question: QuestionData }
  | { type: 'QUESTION_ANSWERED'; answeredCount: number; totalPlayers: number }
  | { type: 'SUBMITTED_ANSWER' }
  | { type: 'QUESTION_RESULTS'; results: QuestionResults }
  | { type: 'GAME_LEADERBOARD'; leaderboard: LeaderboardEntry[] }
  | { type: 'GAME_ENDED'; leaderboard: LeaderboardEntry[] }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CONNECTED' };

const initialState: GameState = {
  phase: 'connecting',
  players: [],
  question: null,
  results: null,
  leaderboard: [],
  previousLeaderboard: [],
  answeredCount: 0,
  totalPlayers: 0,
  answered: false,
  error: null,
  countdownSeconds: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, phase: 'lobby', error: null };
    case 'PLAYER_JOINED':
      return { ...state, players: action.players, error: null };
    case 'PLAYER_LEFT':
      return { ...state, players: action.players };
    case 'GAME_COUNTDOWN':
      return { ...state, phase: 'countdown', countdownSeconds: action.seconds };
    case 'GAME_STARTED':
      return { ...state, phase: 'playing' };
    case 'QUESTION_COUNTDOWN':
      return { ...state, phase: 'questionCountdown', countdownSeconds: action.seconds };
    case 'QUESTION_SHOW':
      return { ...state, phase: 'playing', question: action.question, results: null, answered: false, answeredCount: 0 };
    case 'QUESTION_ANSWERED':
      return { ...state, answeredCount: action.answeredCount, totalPlayers: action.totalPlayers };
    case 'SUBMITTED_ANSWER':
      return { ...state, answered: true };
    case 'QUESTION_RESULTS':
      return { ...state, phase: 'results', results: action.results };
    case 'GAME_LEADERBOARD':
      return { ...state, phase: 'leaderboard', previousLeaderboard: state.leaderboard, leaderboard: action.leaderboard };
    case 'GAME_ENDED':
      return { ...state, phase: 'finished', leaderboard: action.leaderboard };
    case 'ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function useGameSocket() {
  const { socket } = useSocket();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      'player:joined': (data: { players: PlayerInfo[] }) => {
        dispatch({ type: 'CONNECTED' });
        dispatch({ type: 'PLAYER_JOINED', players: data.players });
      },
      'player:left': (data: { players: PlayerInfo[] }) => {
        dispatch({ type: 'PLAYER_LEFT', players: data.players });
      },
      'game:countdown': (data: { seconds: number }) => {
        dispatch({ type: 'GAME_COUNTDOWN', seconds: data.seconds });
      },
      'game:started': () => {
        dispatch({ type: 'GAME_STARTED' });
      },
      'question:countdown': (data: { seconds: number }) => {
          dispatch({ type: 'QUESTION_COUNTDOWN', seconds: data.seconds });
      },
      'question:show': (data: QuestionData) => {
        dispatch({ type: 'QUESTION_SHOW', question: data });
      },
      'question:answered': (data: { answeredCount: number; totalPlayers: number }) => {
        dispatch({ type: 'QUESTION_ANSWERED', answeredCount: data.answeredCount, totalPlayers: data.totalPlayers });
      },
      'question:results': (data: QuestionResults) => {
        dispatch({ type: 'QUESTION_RESULTS', results: data });
      },
      'game:leaderboard': (data: { leaderboard: LeaderboardEntry[] }) => {
        dispatch({ type: 'GAME_LEADERBOARD', leaderboard: data.leaderboard });
      },
      'game:ended': (data: { leaderboard: LeaderboardEntry[] }) => {
        dispatch({ type: 'GAME_ENDED', leaderboard: data.leaderboard });
      },
      'error': (data: { message: string }) => {
        dispatch({ type: 'ERROR', message: data.message });
      },
    };

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler);
    }

    return () => {
      for (const event of Object.keys(handlers)) {
        socket.off(event);
      }
    };
  }, [socket]);

  const joinAsHost = useCallback((pin: string, token: string) => {
    socket?.emit('host:join', { pin, token });
  }, [socket]);

  const joinAsPlayer = useCallback((pin: string, nickname: string) => {
    socket?.emit('player:join', { pin, nickname });
  }, [socket]);

  const startGame = useCallback((pin: string) => {
    socket?.emit('game:start', { pin });
  }, [socket]);

  const submitAnswer = useCallback((pin: string, optionIndex: number) => {
    socket?.emit('question:answer', { pin, optionIndex });
    dispatch({ type: 'SUBMITTED_ANSWER' });
  }, [socket]);

  const nextQuestion = useCallback((pin: string) => {
    socket?.emit('host:next', { pin });
  }, [socket]);

  const showNextQuestion = useCallback((pin: string) => {
    socket?.emit('host:nextQuestion', { pin });
  }, [socket]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return {
    gameState: state,
    actions: { joinAsHost, joinAsPlayer, startGame, submitAnswer, nextQuestion, showNextQuestion, clearError },
  };
}
