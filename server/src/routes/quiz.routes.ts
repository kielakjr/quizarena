import { Router } from 'express';
import { z } from 'zod';
import {
  createQuiz,
  getMyQuizzes,
  getPublicQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuizSchema, updateQuizSchema } from '../validation/quiz';

const router = Router();

router.get('/public', getPublicQuizzes);
router.get('/', authenticate, getMyQuizzes);
router.get('/:id', authenticate, getQuizById);
router.post('/', authenticate, validate(createQuizSchema), createQuiz);
router.put('/:id', authenticate, validate(updateQuizSchema), updateQuiz);
router.delete('/:id', authenticate, deleteQuiz);

export default router;
