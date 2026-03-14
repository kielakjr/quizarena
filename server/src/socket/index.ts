import { Server } from 'socket.io';
import { registerGameHandlers } from './gameHandlers';

export function setUpSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    registerGameHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}
