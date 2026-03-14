import { Request, Response } from 'express';
import { Quiz } from '../models/Quiz';

export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  const quiz = await Quiz.create({
    ...req.body,
    creator: req.userId,
  });

  res.status(201).json({ quiz });
};

export const getMyQuizzes = async (req: Request, res: Response): Promise<void> => {
  const quizzes = await Quiz.find({ creator: req.userId })
    .select('-questions')
    .sort({ createdAt: -1 });

  res.json({ quizzes });
};

export const getPublicQuizzes = async (_req: Request, res: Response): Promise<void> => {
  const quizzes = await Quiz.find({ isPublic: true })
    .select('-questions')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ quizzes });
};

export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  if (!quiz.isPublic && quiz.creator.toString() !== req.userId) {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  res.json({ quiz });
};

export const updateQuiz = async (req: Request, res: Response): Promise<void> => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  if (quiz.creator.toString() !== req.userId) {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ quiz: updated });
};

export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  if (quiz.creator.toString() !== req.userId) {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  await quiz.deleteOne();
  res.json({ message: 'Quiz deleted' });
};
