import { io, Socket } from 'socket.io-client';

const SOCKET_URL = ''; // Uses current origin (proxied by Vite)

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});

// Connect socket and join the user's room by their DB userId (UUID)
// This is required for proper multi-session sync
export const connectSocket = (userId: string) => {
  if (!socket.connected) {
    socket.connect();
  }
  // Always join (re-join) the room on connect
  socket.off('connect');
  socket.on('connect', () => {
    console.log('[SOCKET] Connected, joining room:', userId);
    socket.emit('join-session', userId);
  });
  // If already connected, join immediately
  if (socket.connected) {
    socket.emit('join-session', userId);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
