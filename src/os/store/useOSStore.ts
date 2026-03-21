import { create } from 'zustand';
import { socket, connectSocket, disconnectSocket } from '../utils/socket';

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  component: string; // Used to identify which app to render
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UserSettings {
  username: string;
  wallpaper: string;
  theme: 'dark' | 'light' | 'glass';
}

interface OSState {
  user: UserSettings;
  isAuthenticated: boolean;
  windows: WindowState[];
  activeWindowId: string | null;
  maxZIndex: number;

  // Actions
  login: (username: string) => void;
  logout: () => void;
  init: () => void;
  openWindow: (appId: string, title: string, icon: string, component: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  setWallpaper: (wallpaper: string) => void;
}

export const useOSStore = create<OSState>((set, get) => ({
  user: {
    username: 'Guest',
    wallpaper: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1920',
    theme: 'glass',
  },
  isAuthenticated: false,
  windows: [],
  activeWindowId: null,
  maxZIndex: 10,

  login: (username: string) => {
    connectSocket(username);
    set((state) => ({ 
      isAuthenticated: true, 
      user: { ...state.user, username } 
    }));
  },

  logout: () => {
    disconnectSocket();
    set({ isAuthenticated: false });
  },

  // Initialize with some apps
  init: () => {
    const { openWindow } = get();
    openWindow('explorer-main', 'File Explorer', 'folder', 'explorer');
    openWindow('settings-1', 'Settings', 'settings', 'settings');
  },

  openWindow: (appId, title, icon, component) => {
    const { windows, maxZIndex } = get();
    const existingWindow = windows.find((w) => w.id === appId);

    if (existingWindow) {
      get().focusWindow(appId);
      return;
    }

    const newWindow: WindowState = {
      id: appId,
      title,
      icon,
      component,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: maxZIndex + 1,
      x: 100 + windows.length * 30,
      y: 100 + windows.length * 30,
      width: 600,
      height: 400,
    };

    set({
      windows: [...windows, newWindow],
      activeWindowId: appId,
      maxZIndex: maxZIndex + 1,
    });
  },

  closeWindow: (id) => set((state) => ({
    windows: state.windows.filter((w) => w.id !== id),
    activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
  })),

  focusWindow: (id) => {
    const { maxZIndex } = get();
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: maxZIndex + 1, isMinimized: false } : w
      ),
      activeWindowId: id,
      maxZIndex: maxZIndex + 1,
    }));
  },

  minimizeWindow: (id) => set((state) => ({
    windows: state.windows.map((w) =>
      w.id === id ? { ...w, isMinimized: true } : w
    ),
    activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
  })),

  maximizeWindow: (id) => set((state) => ({
    windows: state.windows.map((w) =>
      w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
    ),
  })),

  updateWindowPosition: (id, x, y) => {
    set((state) => {
      const newWindows = state.windows.map((w) => w.id === id ? { ...w, x, y } : w);
      socket.emit('window-update', { userId: state.user.username, windowId: id, type: 'move', x, y });
      return { windows: newWindows };
    });
  },

  updateWindowSize: (id, width, height) => {
    set((state) => {
      const newWindows = state.windows.map((w) => w.id === id ? { ...w, width, height } : w);
      socket.emit('window-update', { userId: state.user.username, windowId: id, type: 'resize', width, height });
      return { windows: newWindows };
    });
  },

  setWallpaper: (wallpaper) => set((state) => ({
    user: { ...state.user, wallpaper },
  })),
}));
