import mongoose, { Document, Schema } from 'mongoose';

export interface IPersistedPlayer {
  nickname: string;
  score: number;
  streak: number;
}

export interface IGameSession extends Document {
  pin: string;
  quizId: string;
  hostUserId: string;
  status: 'lobby' | 'playing' | 'results' | 'leaderboard' | 'finished';
  players: IPersistedPlayer[];
  quizTitle: string;
  quizQuestions: unknown[];
  currentQuestionIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const persistedPlayerSchema = new Schema<IPersistedPlayer>(
  {
    nickname: { type: String, required: true },
    score: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
  },
  { _id: false }
);

const gameSessionSchema = new Schema<IGameSession>(
  {
    pin: { type: String, required: true, unique: true },
    quizId: { type: String, required: true },
    hostUserId: { type: String, required: true },
    status: {
      type: String,
      enum: ['lobby', 'playing', 'results', 'leaderboard', 'finished'],
      default: 'lobby',
    },
    players: [persistedPlayerSchema],
    quizTitle: { type: String, required: true },
    quizQuestions: { type: Schema.Types.Mixed, required: true },
    currentQuestionIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gameSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 });

export const GameSessionModel = mongoose.model<IGameSession>('GameSession', gameSessionSchema);
