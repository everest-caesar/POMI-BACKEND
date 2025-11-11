import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import { initializeBucket, initializeBusinessBucket } from './services/storageService.js';

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Setup Socket.io with CORS for your frontend
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Store active connections (userId -> socket.id mapping)
const activeUsers = new Map<string, Set<string>>();
const socketUserMap = new Map<string, string>();

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Authenticate socket connection with userId
  socket.on('authenticate', (payload: { token?: string }) => {
    try {
      const token = payload?.token;
      if (!token) {
        socket.emit('auth:error', 'Missing authentication token');
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const userId = decoded?.userId;

      if (!userId) {
        socket.emit('auth:error', 'Invalid authentication token');
        socket.disconnect();
        return;
      }

      // Store user's socket connection
      if (!activeUsers.has(userId)) {
        activeUsers.set(userId, new Set());
      }
      activeUsers.get(userId)!.add(socket.id);
      socketUserMap.set(socket.id, userId);

      socket.emit('auth:success');

      // Notify others that this user is online
      socket.broadcast.emit('user:online', { userId });

      console.log(`👤 User authenticated: ${userId} (${socket.id})`);
    } catch (error) {
      console.error('Socket authentication failed:', error);
      socket.emit('auth:error', 'Authentication failed');
      socket.disconnect();
    }
  });

  // Handle incoming messages
  socket.on('message:send', (data: { recipientId: string; content: string; listingId?: string }) => {
    const senderId = socketUserMap.get(socket.id);

    if (!senderId) {
      socket.emit('auth:error', 'Authentication required');
      return;
    }

    if (!data?.recipientId || !data?.content) {
      socket.emit('message:error', { message: 'Recipient and content are required' });
      return;
    }

    // Emit to recipient(s) if they're connected
    const recipientSockets = activeUsers.get(data.recipientId);
    if (recipientSockets) {
      recipientSockets.forEach((socketId) => {
        io.to(socketId).emit('message:receive', {
          senderId,
          content: data.content,
          listingId: data.listingId,
          timestamp: new Date(),
        });
        io.to(socketId).emit('typing:stop', { userId: senderId });
      });
    }
  });

  // Handle typing indicator
  socket.on('typing:start', (data: { recipientId: string }) => {
    const senderId = socketUserMap.get(socket.id);

    if (!senderId || !data?.recipientId) return;

    const recipientSockets = activeUsers.get(data.recipientId);
    if (recipientSockets) {
      recipientSockets.forEach((socketId) => {
        io.to(socketId).emit('typing:start', { userId: senderId });
      });
    }
  });

  socket.on('typing:stop', (data: { recipientId: string }) => {
    const senderId = socketUserMap.get(socket.id);

    if (!senderId || !data?.recipientId) return;

    const recipientSockets = activeUsers.get(data.recipientId);
    if (recipientSockets) {
      recipientSockets.forEach((socketId) => {
        io.to(socketId).emit('typing:stop', { userId: senderId });
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = socketUserMap.get(socket.id);
    socketUserMap.delete(socket.id);

    if (userId) {
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
          console.log(`👋 User disconnected: ${userId}`);
        }
      }
    }
  });
});

// Make io accessible to routes if needed
app.set('io', io);

server.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Socket.io enabled for real-time messaging`);

  // Initialize MinIO buckets
  try {
    await initializeBucket();
    await initializeBusinessBucket();
  } catch (error) {
    console.error('❌ Failed to initialize MinIO buckets:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
