import { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { env } from './config/env';
import { setUpSocket } from './socket';

import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';
import gameRoutes from './routes/game.routes';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    methods: ['GET', 'POST'],
  }
});

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

setUpSocket(io);

app.use('/auth', authRoutes);
app.use('/quizzes', quizRoutes);
app.use('/games', gameRoutes);

export { server };
export default app;
