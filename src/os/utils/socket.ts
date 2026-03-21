import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // We'll connect manually when authenticated
});

export const connectSocket = (username: string) => {
  if (!socket.connected) {
    socket.connect();
    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join-session', username);
    });
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
