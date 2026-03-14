import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOption {
  _id: Types.ObjectId;
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  _id: Types.ObjectId;
  text: string;
  imageUrl?: string;
  options: IOption[];
  timeLimit: number;
  points: number;
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  creator: Types.ObjectId;
  coverImage?: string;
  isPublic: boolean;
  questions: IQuestion[];
  timesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: true }
);

const questionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    imageUrl: { type: String },
    options: {
      type: [optionSchema],
      validate: {
        validator: (opts: IOption[]) => opts.length === 4,
        message: 'Each question must have exactly 4 options',
      },
    },
    timeLimit: { type: Number, default: 20, min: 5, max: 60 },
    points: { type: Number, default: 1000, min: 100, max: 2000 },
  },
  { _id: true }
);

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coverImage: String,
    isPublic: { type: Boolean, default: true },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (q: IQuestion[]) => q.length >= 1,
        message: 'Quiz must have at least 1 question',
      },
    },
    timesPlayed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
