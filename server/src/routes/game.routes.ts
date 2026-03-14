import { Router } from 'express';
import { createGame } from '../controllers/game.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/create', authenticate, createGame);

export default router;
