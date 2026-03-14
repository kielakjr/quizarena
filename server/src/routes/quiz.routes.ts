import { Router } from 'express';
import {
  createQuiz,
  getMyQuizzes,
  getPublicQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const quizUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'questionImages', maxCount: 20 },
]);

const router = Router();

router.get('/public', getPublicQuizzes);
router.get('/', authenticate, getMyQuizzes);
router.get('/:id', authenticate, getQuizById);
router.post('/', authenticate, quizUpload, createQuiz);
router.put('/:id', authenticate, quizUpload, updateQuiz);
router.delete('/:id', authenticate, deleteQuiz);

export default router;
