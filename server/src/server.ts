import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

// Load .env from the root of the project
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = parseInt(process.env.PORT || '5174', 10);
const DIST_DIR = path.resolve(__dirname, '../../dist');
const HAS_DIST = fs.existsSync(path.join(DIST_DIR, 'index.html'));

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Serve compiled frontend if available ---
if (HAS_DIST) {
  app.use(express.static(DIST_DIR));
  console.log('[UsablOS] Serving frontend from /dist');
}

// --- Helper: broadcast full state to all sessions of a user ---
const broadcastState = async (userId: string) => {
  const windows = await prisma.window.findMany({ where: { userId } });
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    select: { 
      id: true, username: true, wallpaper: true, theme: true, 
      screensaverType: true, brightness: true, volume: true, isBrightnessSynced: true, desktopIcons: true 
    } 
  });
  
  if (user && typeof user.desktopIcons === 'string') {
    try { (user as any).desktopIcons = JSON.parse(user.desktopIcons); } catch { (user as any).desktopIcons = []; }
  }

  io.to(userId).emit('state-sync', { windows, user });
  console.log(`[SOCKET] Broadcasted full state to room ${userId}: ${windows.length} windows`);
};

// --- DIAGNOSTIC / SPA fallback ---
app.get('/', (req, res) => {
  if (HAS_DIST) {
    return res.sendFile(path.join(DIST_DIR, 'index.html'));
  }
  res.send('<h1>UsablOS Backend: <span style="color:#10b981">ONLINE</span></h1><p>Frontend not built. Run <code>npm run build</code> to serve the OS here.</p>');
});

// --- AUTH ---
app.post('/api/auth/register', async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const { username, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username taken' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword } });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, wallpaper: user.wallpaper, theme: user.theme } });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, wallpaper: user.wallpaper, theme: user.theme } });
  } catch (error) { next(error); }
});

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    (req as any).user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

// --- USER SETTINGS ---
app.put('/api/user/settings', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { wallpaper, theme, screensaverType, brightness, volume, isBrightnessSynced, desktopIcons } = req.body;
    const update: any = {};
    if (wallpaper !== undefined) update.wallpaper = wallpaper;
    if (theme !== undefined) update.theme = theme;
    if (screensaverType !== undefined) update.screensaverType = screensaverType;
    if (brightness !== undefined) update.brightness = brightness;
    if (volume !== undefined) update.volume = volume;
    if (isBrightnessSynced !== undefined) update.isBrightnessSynced = isBrightnessSynced;
    if (desktopIcons !== undefined) update.desktopIcons = JSON.stringify(desktopIcons);
    
    await prisma.user.update({ where: { id: userId }, data: update });
    await broadcastState(userId);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// --- FILE SYSTEM ---
app.get('/api/files', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { parentId, all } = req.query;
    
    let where: any = { userId };
    if (all !== 'true') {
      where.parentId = parentId ? String(parentId) : null;
    }
    
    const files = await prisma.file.findMany({ where });
    res.json(files);
  } catch (error) { next(error); }
});

app.get('/api/files/:id', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (error) { next(error); }
});

app.post('/api/files', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { name, content, type, parentId } = req.body;
    const file = await prisma.file.create({ data: { name, content: content || '', type: type || 'txt', userId, parentId } });
    res.json(file);
  } catch (error) { next(error); }
});

app.put('/api/files/:id', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { content, name, parentId } = req.body;
    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    const updated = await prisma.file.update({
      where: { id },
      data: { 
        content: content !== undefined ? content : file.content, 
        name: name || file.name,
        ...(parentId !== undefined && { parentId })
      }
    });
    res.json(updated);
  } catch (error) { next(error); }
});

app.delete('/api/files/:id', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    await prisma.file.deleteMany({ where: { id, userId } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

// --- WORKSPACE: Full-State Sync Model ---
// GET: return full current state (windows + user settings)
app.get('/api/state', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const windows = await prisma.window.findMany({ where: { userId } });
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { 
        id: true, username: true, wallpaper: true, theme: true, 
        screensaverType: true, brightness: true, volume: true, isBrightnessSynced: true, desktopIcons: true 
      } 
    });
    
    if (user && typeof user.desktopIcons === 'string') {
      try { (user as any).desktopIcons = JSON.parse(user.desktopIcons); } catch { (user as any).desktopIcons = []; }
    }

    res.json({ windows, user });
  } catch (error) { next(error); }
});

// POST: open a window (upsert) → broadcast full state
app.post('/api/windows', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { appId, title, icon, component, x, y, width, height, zIndex } = req.body;

    // Atomic: delete any existing rows for this appId (handles duplicates), then create fresh
    await prisma.window.deleteMany({ where: { appId, userId } });
    await prisma.window.create({
      data: {
        appId,
        title,
        icon: icon || 'settings',
        component: component || 'settings',
        x: x || 80,
        y: y || 80,
        width: width || 700,
        height: height || 450,
        zIndex: zIndex || 10,
        userId,
      }
    });

    await broadcastState(userId);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// PUT: update window state → broadcast full state
app.put('/api/windows/:appId', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { appId } = req.params;
    const data = req.body;
    await prisma.window.updateMany({
      where: { appId, userId },
      data: {
        ...(data.x !== undefined && { x: Math.round(data.x) }),
        ...(data.y !== undefined && { y: Math.round(data.y) }),
        ...(data.width !== undefined && { width: Math.round(data.width) }),
        ...(data.height !== undefined && { height: Math.round(data.height) }),
        ...(data.zIndex !== undefined && { zIndex: data.zIndex }),
        ...(data.isOpen !== undefined && { isOpen: data.isOpen }),
        ...(data.isMinimized !== undefined && { isMinimized: data.isMinimized }),
        ...(data.isMaximized !== undefined && { isMaximized: data.isMaximized }),
      }
    });
    await broadcastState(userId);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// DELETE: close a window → broadcast full state
app.delete('/api/windows/:appId', authMiddleware, async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { appId } = req.params;
    await prisma.window.deleteMany({ where: { appId, userId } });
    await broadcastState(userId);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// In-memory store for cursor/session mapping and app states
const socketToUser = new Map<string, string>();
const calcStates = new Map<string, { display: string; equation: string }>();

io.on('connection', (socket) => {
  console.log(`[SOCKET] Connected: ${socket.id}`);

  socket.on('join-session', async (userId: string) => {
    socket.join(userId);
    socketToUser.set(socket.id, userId);
    console.log(`[SOCKET] ${socket.id} joined room: ${userId}`);
    
    const windows = await prisma.window.findMany({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { wallpaper: true, theme: true } }).catch(() => null);
    socket.emit('state-sync', { windows, user });

    // Sync current calculator state if exists
    const calcState = calcStates.get(userId);
    if (calcState) {
      socket.emit('calc-sync', calcState);
    }
  });

  // Cursor sync
  socket.on('cursor-move', (data: { userId: string; username: string; x: number; y: number }) => {
    socket.to(data.userId).emit('cursor-sync', { 
      socketId: socket.id, 
      username: data.username, 
      x: data.x, 
      y: data.y 
    });
  });

  // Calculator sync
  socket.on('calc-update', (data: { userId: string; display: string; equation: string }) => {
    calcStates.set(data.userId, { display: data.display, equation: data.equation });
    socket.to(data.userId).emit('calc-sync', data);
  });

  // Brightness sync — one session sets the global brightness and all other sessions follow
  socket.on('brightness-sync', (data: { userId: string; brightness: number }) => {
    socket.to(data.userId).emit('brightness-update', { brightness: data.brightness });
  });

  // UI popover sync (Start Menu, Action Center, Calendar)
  socket.on('ui-sync', (data: { userId: string; type: 'startMenu' | 'actionCenter' | 'calendar'; open: boolean }) => {
    socket.to(data.userId).emit('ui-sync-received', data);
  });

  // Notepad collaborative editing
  socket.on('notepad-update', (data: { userId: string; fileId: string; content: string }) => {
    socket.to(data.userId).emit('notepad-sync', data);
  });

  // Window position/state sync
  socket.on('window-sync', (data: { userId: string; id: string; x: number; y: number; width?: number; height?: number }) => {
    socket.to(data.userId).emit('window-sync-received', data);
  });

  // Paint collaborative sync
  socket.on('paint-update', (data: { userId: string; fileId: string; type: string, x?: number, y?: number, color: string, brushSize: number, isStart?: boolean, text?: string, x1?: number, y1?: number, x2?: number, y2?: number, tool?: string }) => {
    socket.to(data.userId).emit('paint-sync', data);
  });

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      socket.to(userId).emit('cursor-remove', socket.id);
      socketToUser.delete(socket.id);
    }
    console.log(`[SOCKET] Disconnected: ${socket.id}`);
  });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('!!! SERVER ERROR !!!', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// --- SPA FALLBACK (must be after all API routes) ---
if (HAS_DIST) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`[UsablOS] Server running on port ${PORT}`);
  if (HAS_DIST) {
    console.log(`[UsablOS] Frontend available at http://localhost:${PORT}`);
  } else {
    console.log(`[UsablOS] Frontend (dist) NOT FOUND. Running in API-only mode.`);
  }
});
