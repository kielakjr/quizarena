import { Request, Response } from 'express';
import { Quiz } from '../models/Quiz';
import { gameStore } from '../socket/GameStore';

export const createGame = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.body;

  if (!quizId) {
    res.status(400).json({ message: 'quizId is required' });
    return;
  }

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  if (quiz.creator.toString() !== req.userId) {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  const pin = gameStore.generatePin();
  gameStore.createGame(pin, quizId, req.userId!, {
    title: quiz.title,
    questions: quiz.questions,
  });

  res.status(201).json({ pin });
};
