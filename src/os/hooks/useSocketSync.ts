import { useEffect, useRef } from 'react';
import { useOSStore } from '../store/useOSStore';
import { socket } from '../utils/socket';

export const useSocketSync = () => {
  const { 
    user, isAuthenticated, applyServerState, 
    updateRemoteCursor, removeRemoteCursor,
    setStartMenuOpen, setActionCenterOpen,
    updateUser, updateWindowFromRemote
  } = useOSStore();
  const listenersAttached = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user.id) return;
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    // Authoritative State Sync
    const handleStateSync = (data: { windows: any[]; user?: any }) => {
      applyServerState(data.windows || [], data.user);
    };

    // UI Popover Sync
    const handleUISync = (data: { type: string; open: boolean }) => {
      if (data.type === 'startMenu') setStartMenuOpen(data.open, true);
      if (data.type === 'actionCenter') setActionCenterOpen(data.open, true);
    };

    // Brightness Sync
    const handleBrightnessUpdate = (data: { brightness: number }) => {
      updateUser({ brightness: data.brightness } as any);
    };

    // Real-time Window Drag/Resize Sync
    const handleWindowSyncReceived = (data: any) => {
      updateWindowFromRemote(data);
    };

    // Cursor Sync
    const handleCursorSync = (data: any) => {
      updateRemoteCursor(data.socketId, { username: data.username, x: data.x, y: data.y });
    };
    const handleCursorRemove = (socketId: string) => {
      removeRemoteCursor(socketId);
    };

    socket.on('state-sync', handleStateSync);
    socket.on('ui-sync-received', handleUISync);
    socket.on('brightness-update', handleBrightnessUpdate);
    socket.on('window-sync-received', handleWindowSyncReceived);
    socket.on('cursor-sync', handleCursorSync);
    socket.on('cursor-remove', handleCursorRemove);

    return () => {
      socket.off('state-sync', handleStateSync);
      socket.off('ui-sync-received', handleUISync);
      socket.off('brightness-update', handleBrightnessUpdate);
      socket.off('window-sync-received', handleWindowSyncReceived);
      socket.off('cursor-sync', handleCursorSync);
      socket.off('cursor-remove', handleCursorRemove);
      listenersAttached.current = false;
    };
  }, [isAuthenticated, user.id, applyServerState, updateRemoteCursor, removeRemoteCursor, setStartMenuOpen, setActionCenterOpen, updateUser, updateWindowFromRemote]);
};
