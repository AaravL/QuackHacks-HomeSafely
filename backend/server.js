// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const expressWs = require('express-ws');
const http = require('http');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const { authMiddleware, errorHandler } = require('./middleware/auth');
const frontendOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

// Create WebSocket app
expressWs(app, server);

// Middleware
app.use(cors({
  origin: frontendOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', authMiddleware, require('./routes/posts'));
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/messages', authMiddleware, require('./routes/messages'));
app.use('/api/recommendations', authMiddleware, require('./routes/recommendations'));

// WebSocket for real-time messaging
const connectedUsers = new Map(); // Store active connections

app.ws('/ws/messages/:userId', (ws, req) => {
  const { userId } = req.params;
  
  console.log(`[WebSocket] User ${userId} connected`);
  connectedUsers.set(userId, ws);

  // Notify other users that this user is online
  broadcast({
    type: 'user-online',
    userId: userId,
    timestamp: new Date(),
  });

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log(`[WebSocket] Message from ${userId}:`, data.recipientId);

      // Send message to recipient if connected
      if (connectedUsers.has(data.recipientId)) {
        const recipientWs = connectedUsers.get(data.recipientId);
        recipientWs.send(JSON.stringify({
          ...data,
          senderId: userId,
          type: 'message',
          timestamp: new Date(),
        }));
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] User ${userId} disconnected`);
    connectedUsers.delete(userId);

    // Notify other users that this user is offline
    broadcast({
      type: 'user-offline',
      userId: userId,
      timestamp: new Date(),
    });
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Error with user ${userId}:`, error);
  });
});

// Helper function to broadcast messages to all connected users
function broadcast(message) {
  connectedUsers.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    connectedUsers: connectedUsers.size,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🚗 Hitch Server Running            ║
║   Port: ${PORT}                         ║
║   Env: ${process.env.NODE_ENV}                      ║
╚════════════════════════════════════╝
  `);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };
