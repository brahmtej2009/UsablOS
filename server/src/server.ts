import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST']
  }
});

// Mock Database for quick demo before Prisma migration
const sessions: Record<string, any> = {};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword }
    });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, wallpaper: user.wallpaper, theme: user.theme } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, wallpaper: user.wallpaper, theme: user.theme } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// --- FILE SYSTEM ROUTES ---

// Middleware to protect routes and get user
const authMiddleware = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/files', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const files = await prisma.file.findMany({ where: { userId, parentId: null } });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.get('/api/files/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

app.post('/api/files', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { name, content, type, parentId } = req.body;
    const file = await prisma.file.create({
      data: { name, content: content || '', type: type || 'txt', userId, parentId }
    });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create file' });
  }
});

app.put('/api/files/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { content, name } = req.body;
    
    // Ensure ownership
    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const updated = await prisma.file.update({
      where: { id },
      data: { content: content !== undefined ? content : file.content, name: name || file.name }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update file' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-session', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Sync window movements
  socket.on('window-update', (data) => {
    // data: { userId, windowId, x, y, width, height, isMinimized, etc }
    socket.to(data.userId).emit('window-sync', data);
  });

  // Sync notepad content
  socket.on('notepad-update', (data) => {
    // data: { userId, content }
    socket.to(data.userId).emit('notepad-sync', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
