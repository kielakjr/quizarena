export interface Option {
  _id?: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id?: string;
  text: string;
  imageUrl?: string;
  options: Option[];
  timeLimit: number;
  points: number;
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  creator: string;
  coverImage?: string;
  isPublic: boolean;
  questions: Question[];
  timesPlayed: number;
  createdAt: string;
  updatedAt: string;
}

export type QuizSummary = Omit<Quiz, 'questions'>;
