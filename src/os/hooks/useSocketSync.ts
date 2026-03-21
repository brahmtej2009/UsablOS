import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useOSStore } from '../store/useOSStore';

const SOCKET_URL = 'http://localhost:3001';

export const useSocketSync = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated, updateWindowPosition, updateWindowSize } = useOSStore();

  useEffect(() => {
    if (!isAuthenticated || !user.username) return;

    // Connect to server
    socketRef.current = io(SOCKET_URL);
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join-session', user.username); // Join a room based on username for collaboration
    });

    // Listen for window sync events from other sessions on this account
    socket.on('window-sync', (data) => {
      if (data.type === 'move') {
        updateWindowPosition(data.windowId, data.x, data.y);
      } else if (data.type === 'resize') {
        updateWindowSize(data.windowId, data.width, data.height);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user.username, updateWindowPosition, updateWindowSize]);

  return socketRef.current;
};
