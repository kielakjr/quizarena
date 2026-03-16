import { server } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { gameStore } from './socket/GameStore';

const start = async () => {
  await connectDB();

  const restored = await gameStore.restoreGames();
  if (restored > 0) {
    console.log(`Restored ${restored} game session(s) from database`);
  }

  server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

start();
