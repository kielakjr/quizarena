import { server } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const start = async () => {
  await connectDB();
  server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

start();
