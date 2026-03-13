import { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';

import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use('/auth', authRoutes);

export default app;
