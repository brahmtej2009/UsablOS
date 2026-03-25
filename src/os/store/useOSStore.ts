import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../utils/socket';

export interface WindowState {
  id: string;       // = appId (logical key, e.g. "settings-1")
  title: string;
  icon: string;
  component: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UserSettings {
  id?: string;
  username: string;
  wallpaper: string;
  theme: 'glass' | 'dark' | 'midnight' | 'aero' | 'light';
  screensaverType: 'particles' | 'nebula' | 'matrix' | 'bubbles';
  brightness: number;
  volume: number;
  isBrightnessSynced: boolean;
  desktopIcons: { appId: string; x: number; y: number }[];
}

export interface DialogState {
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
  isOpen: boolean;
  value?: string;
}

interface OSState {
  user: UserSettings;
  isAuthenticated: boolean;
  windows: WindowState[];
  activeWindowId: string | null;
  maxZIndex: number;
  initDone: boolean;
  isSleeping: boolean;

  // UI Popover Sync
  isStartMenuOpen: boolean;
  isActionCenterOpen: boolean;
  setStartMenuOpen: (open: boolean, remote?: boolean) => void;
  setActionCenterOpen: (open: boolean, remote?: boolean) => void;

  // Desktop Icons
  addDesktopIcon: (appId: string) => void;
  removeDesktopIcon: (appId: string) => void;
  moveDesktopIcon: (appId: string, x: number, y: number) => void;

  login: (token: string, user: any) => void;
  checkAuth: () => boolean;
  logout: () => void;
  init: () => void;
  applyServerState: (serverWindows: any[], serverUser?: any) => void;
  openWindow: (appId: string, title: string, icon: string, component: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  minimizeAll: () => void;
  remoteCursors: Record<string, { username: string; x: number; y: number }>;
  updateRemoteCursor: (socketId: string, data: { username: string; x: number; y: number }) => void;
  removeRemoteCursor: (socketId: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  updateWindowFromRemote: (data: { id: string; x: number; y: number; width?: number; height?: number }) => void;
  setIsSleeping: (isSleeping: boolean) => void;
  updateUser: (user: Partial<UserSettings>) => void;
  
  // Dialogs
  dialog: DialogState;
  showDialog: (dialog: Omit<DialogState, 'isOpen'>) => void;
  closeDialog: () => void;

  // Internal: track locally closed IDs to prevent sync-bounce
  closedIds: Set<string>;
}

const getToken = () => localStorage.getItem('webos_token');

const dbToState = (w: any): WindowState => ({
  id: w.appId,
  title: w.title,
  icon: w.icon || 'settings',
  component: w.component || 'settings',
  isOpen: w.isOpen ?? true,
  isMinimized: w.isMinimized ?? false,
  isMaximized: w.isMaximized ?? false,
  zIndex: w.zIndex ?? 10,
  x: w.x ?? 100,
  y: w.y ?? 100,
  width: w.width ?? 700,
  height: w.height ?? 450,
});

const apiCall = (method: string, path: string, body?: any) =>
  fetch(path, {
    method,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(console.error);

const DEFAULT_WALLPAPER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1920';

export const useOSStore = create<OSState>((set, get) => ({
  user: { 
    username: 'Guest', 
    wallpaper: DEFAULT_WALLPAPER, 
    theme: 'glass', 
    screensaverType: 'particles',
    brightness: 100,
    volume: 50,
    isBrightnessSynced: true,
    desktopIcons: []
  },
  isAuthenticated: false,
  windows: [],
  activeWindowId: null,
  maxZIndex: 10,
  initDone: false,
  isSleeping: false,
  remoteCursors: {},
  dialog: { type: 'alert', title: '', message: '', isOpen: false },
  closedIds: new Set(),

  // UI Popover Sync
  isStartMenuOpen: false,
  isActionCenterOpen: false,

  setStartMenuOpen: (open, remote) => {
    set({ isStartMenuOpen: open });
    if (!remote) {
      const userId = get().user.id;
      if (userId) {
        import('../utils/socket').then(({ socket }) => {
          socket.emit('ui-sync', { userId, type: 'startMenu', open });
        });
      }
    }
  },
  setActionCenterOpen: (open, remote) => {
    set({ isActionCenterOpen: open });
    if (!remote) {
      const userId = get().user.id;
      if (userId) {
        import('../utils/socket').then(({ socket }) => {
          socket.emit('ui-sync', { userId, type: 'actionCenter', open });
        });
      }
    }
  },

  // Desktop Icons
  addDesktopIcon: (appId) => {
    const { user } = get();
    if (user.desktopIcons.some(i => i.appId === appId)) return;
    const newIcons = [...user.desktopIcons, { appId, x: 20, y: 20 }];
    get().updateUser({ desktopIcons: newIcons });
  },
  removeDesktopIcon: (appId) => {
    const { user } = get();
    const newIcons = user.desktopIcons.filter(i => i.appId !== appId);
    get().updateUser({ desktopIcons: newIcons });
  },
  moveDesktopIcon: (appId, x, y) => {
    const { user } = get();
    const newIcons = user.desktopIcons.map(i => i.appId === appId ? { ...i, x, y } : i);
    get().updateUser({ desktopIcons: newIcons });
  },

  login: (token, user) => {
    localStorage.setItem('webos_token', token);
    localStorage.setItem('webos_user', JSON.stringify(user));
    connectSocket(user.id);
    set({
      isAuthenticated: true,
      initDone: false,
      user: {
        id: user.id,
        username: user.username,
        wallpaper: user.wallpaper || DEFAULT_WALLPAPER,
        theme: user.theme || 'glass',
        screensaverType: user.screensaverType || 'particles',
        brightness: user.brightness ?? 100,
        volume: user.volume ?? 50,
        isBrightnessSynced: user.isBrightnessSynced ?? true,
        desktopIcons: user.desktopIcons || []
      }
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem('webos_token');
    const userStr = localStorage.getItem('webos_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        connectSocket(user.id);
        set({
          isAuthenticated: true,
          user: {
            id: user.id,
            username: user.username,
            wallpaper: user.wallpaper || DEFAULT_WALLPAPER,
            theme: user.theme || 'glass',
            screensaverType: user.screensaverType || 'particles',
            brightness: user.brightness ?? 100,
            volume: user.volume ?? 50,
            isBrightnessSynced: user.isBrightnessSynced ?? true,
            desktopIcons: user.desktopIcons || []
          }
        });
        return true;
      } catch {
        localStorage.removeItem('webos_token');
        localStorage.removeItem('webos_user');
      }
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('webos_token');
    localStorage.removeItem('webos_user');
    disconnectSocket();
    set({ isAuthenticated: false, windows: [], activeWindowId: null, initDone: false });
  },

  applyServerState: (serverWindows, serverUser) => {
    const { closedIds } = get();
    // Filter out windows that we just closed locally but server still has
    const filtered = serverWindows.filter(w => !closedIds.has(w.appId));

    // Clean up closedIds: if a window is in closedIds but NO LONGER in the server list, 
    // the server has confirmed the deletion.
    const stillPending = new Set([...closedIds].filter(id => serverWindows.some(w => w.appId === id)));

    const windows = filtered.map(dbToState);
    const maxZIndex = windows.length ? Math.max(...windows.map(w => w.zIndex), 10) : 10;
    set(state => ({
      windows,
      maxZIndex,
      closedIds: stillPending,
      user: serverUser
        ? { 
            ...state.user, 
            ...serverUser,
            desktopIcons: serverUser.desktopIcons !== undefined ? serverUser.desktopIcons : state.user.desktopIcons 
          }
        : state.user,
    }));
  },

  init: async () => {
    const state = get();
    if (state.initDone) return;
    set({ initDone: true });

    try {
      const res = await apiCall('GET', '/api/state');
      if (res && res.ok) {
        const { windows: serverWindows, user: serverUser } = await res.json();
        get().applyServerState(serverWindows, serverUser);
        if (serverUser) {
          const userStr = localStorage.getItem('webos_user');
          if (userStr) {
            try {
              const cached = JSON.parse(userStr);
              localStorage.setItem('webos_user', JSON.stringify({ ...cached, ...serverUser }));
            } catch { /* ignore */ }
          }
        }
        return;
      }
    } catch (e) {
      console.error('[STORE] Failed to init workspace:', e);
    }
  },

  openWindow: (appId, title, icon, component) => {
    const { windows, maxZIndex } = get();
    const existing = windows.find(w => w.id === appId);
    if (existing) {
      if (existing.isMinimized) {
        set(state => ({
          windows: state.windows.map(w => w.id === appId ? { ...w, isMinimized: false, zIndex: state.maxZIndex + 1 } : w),
          maxZIndex: state.maxZIndex + 1,
          activeWindowId: appId,
        }));
      } else {
        get().focusWindow(appId);
      }
      apiCall('POST', '/api/windows', { appId, title, icon, component });
      return;
    }

    const newZ = maxZIndex + 1;
    const offset = (windows.length % 8) * 30;
    const newWin: WindowState = {
      id: appId, title, icon, component,
      isOpen: true, isMinimized: false, isMaximized: false,
      zIndex: newZ,
      x: 80 + offset, y: 80 + offset,
      width: 700, height: 450,
    };
    set({ windows: [...windows, newWin], activeWindowId: appId, maxZIndex: newZ });
    apiCall('POST', '/api/windows', { appId, title, icon, component, x: newWin.x, y: newWin.y, width: newWin.width, height: newWin.height, zIndex: newZ });
  },

  closeWindow: (id) => {
    set(state => {
      const nextClosed = new Set(state.closedIds);
      nextClosed.add(id);
      return {
        windows: state.windows.filter(w => w.id !== id),
        activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
        closedIds: nextClosed
      };
    });
    apiCall('DELETE', `/api/windows/${id}`);
  },

  focusWindow: (id) => {
    const newZ = get().maxZIndex + 1;
    set(state => ({
      windows: state.windows.map(w => w.id === id ? { ...w, zIndex: newZ, isMinimized: false } : w),
      activeWindowId: id,
      maxZIndex: newZ,
    }));
    apiCall('PUT', `/api/windows/${id}`, { isMinimized: false, zIndex: newZ });
  },

  minimizeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w => w.id === id ? { ...w, isMinimized: true } : w),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }));
    apiCall('PUT', `/api/windows/${id}`, { isMinimized: true });
  },

  maximizeWindow: (id) => {
    set(state => {
      const win = state.windows.find(w => w.id === id);
      if (!win) return state;
      const isMaximized = !win.isMaximized;
      apiCall('PUT', `/api/windows/${id}`, { isMaximized });
      return { windows: state.windows.map(w => w.id === id ? { ...w, isMaximized } : w) };
    });
  },

  minimizeAll: () => {
    const { windows } = get();
    const anyNotMinimized = windows.some(w => !w.isMinimized);
    const newState = anyNotMinimized;
    set({
      windows: windows.map(w => ({ ...w, isMinimized: newState })),
      activeWindowId: newState ? null : get().activeWindowId
    });
    windows.forEach(w => {
      apiCall('PUT', `/api/windows/${w.id}`, { isMinimized: newState });
    });
  },

  updateRemoteCursor: (socketId, data) => set(state => ({
    remoteCursors: { ...state.remoteCursors, [socketId]: data }
  })),
  removeRemoteCursor: (socketId) => set(state => {
    const next = { ...state.remoteCursors };
    delete next[socketId];
    return { remoteCursors: next };
  }),

  updateWindowPosition: (id, x, y) => {
    set(state => ({ windows: state.windows.map(w => w.id === id ? { ...w, x, y } : w) }));
    apiCall('PUT', `/api/windows/${id}`, { x, y });
  },

  updateWindowSize: (id, width, height) => {
    set(state => ({ windows: state.windows.map(w => w.id === id ? { ...w, width, height } : w) }));
    apiCall('PUT', `/api/windows/${id}`, { width, height });
  },
  
  updateWindowFromRemote: (data) => {
    set(state => ({
      windows: state.windows.map(w => w.id === data.id ? { 
        ...w, 
        x: data.x ?? w.x, 
        y: data.y ?? w.y,
        width: data.width ?? w.width,
        height: data.height ?? w.height
      } : w)
    }));
  },

  setIsSleeping: (isSleeping) => set({ isSleeping }),

  updateUser: (newSettings) => set(state => {
    const nextUser = { ...state.user, ...newSettings } as any;
    
    // Persist to server if it contains user-persisted fields
    const persistedKeys = ['wallpaper', 'theme', 'screensaverType', 'brightness', 'volume', 'isBrightnessSynced', 'desktopIcons'];
    const toSync: any = {};
    let shouldSync = false;
    persistedKeys.forEach(k => {
       if (newSettings[k as keyof typeof newSettings] !== undefined) {
          toSync[k] = newSettings[k as keyof typeof newSettings];
          shouldSync = true;
       }
    });

    if (shouldSync) {
       apiCall('PUT', '/api/user/settings', toSync);
       if (newSettings.brightness !== undefined && state.user.isBrightnessSynced) {
         import('../utils/socket').then(({ socket }) => socket.emit('brightness-sync', { userId: state.user.id, brightness: newSettings.brightness }));
       }
    }

    return { user: nextUser };
  }),

  showDialog: (d) => set({ dialog: { ...d, isOpen: true } }),
  closeDialog: () => set(state => ({ dialog: { ...state.dialog, isOpen: false } })),
}));
