import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { initializeBucket, initializeBusinessBucket } from './services/storageService.js';

const PORT = process.env.PORT || 3000;

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

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Authenticate socket connection with userId
  socket.on('authenticate', (userId: string) => {
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store user's socket connection
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId)!.add(socket.id);

    // Notify others that this user is online
    socket.broadcast.emit('user:online', { userId });

    console.log(`👤 User authenticated: ${userId} (${socket.id})`);
  });

  // Handle incoming messages
  socket.on('message:send', (data: { recipientId: string; content: string; listingId?: string }) => {
    const senderId = Array.from(activeUsers.entries()).find((entry) =>
      entry[1].has(socket.id)
    )?.[0];

    if (!senderId) return;

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
      });
    }

    // Also emit typing stopped
    socket.broadcast.emit('typing:stopped', { userId: senderId });
  });

  // Handle typing indicator
  socket.on('typing:start', (data: { recipientId: string }) => {
    const senderId = Array.from(activeUsers.entries()).find((entry) =>
      entry[1].has(socket.id)
    )?.[0];

    if (!senderId) return;

    const recipientSockets = activeUsers.get(data.recipientId);
    if (recipientSockets) {
      recipientSockets.forEach((socketId) => {
        io.to(socketId).emit('typing:start', { userId: senderId });
      });
    }
  });

  socket.on('typing:stop', (data: { recipientId: string }) => {
    const senderId = Array.from(activeUsers.entries()).find((entry) =>
      entry[1].has(socket.id)
    )?.[0];

    if (!senderId) return;

    const recipientSockets = activeUsers.get(data.recipientId);
    if (recipientSockets) {
      recipientSockets.forEach((socketId) => {
        io.to(socketId).emit('typing:stop', { userId: senderId });
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    let disconnectUserId: string | undefined;

    // Remove socket from active users
    for (const [userId, sockets] of activeUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          disconnectUserId = userId;
        }
      }
    }

    if (disconnectUserId) {
      socket.broadcast.emit('user:offline', { userId: disconnectUserId });
      console.log(`👋 User disconnected: ${disconnectUserId}`);
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
