const path = require("path");
const express = require("express");
const cors = require("cors");
const expressWs = require("express-ws");
const http = require("http");

// Load env exactly once (prefer backend/.env)
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { authMiddleware, errorHandler } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);

// Enable WebSockets on this express app
expressWs(app, server);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use("/api/auth", require("./routes/auth"));

// Protected routes
app.use("/api/posts", authMiddleware, require("./routes/posts"));
app.use("/api/users", authMiddleware, require("./routes/users"));
app.use("/api/messages", authMiddleware, require("./routes/messages"));
app.use("/api/recommendations", authMiddleware, require("./routes/recommendations"));

// WebSocket for real-time messaging
const connectedUsers = new Map();

app.ws("/ws/messages/:userId", (ws, req) => {
  const { userId } = req.params;

  console.log(`[WebSocket] User ${userId} connected`);
  connectedUsers.set(userId, ws);

  broadcast({
    type: "user-online",
    userId,
    timestamp: new Date(),
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data?.recipientId && connectedUsers.has(data.recipientId)) {
        const recipientWs = connectedUsers.get(data.recipientId);
        recipientWs.send(
          JSON.stringify({
            ...data,
            senderId: userId,
            type: "message",
            timestamp: new Date(),
          })
        );
      }
    } catch (error) {
      console.error("[WebSocket] Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`[WebSocket] User ${userId} disconnected`);
    connectedUsers.delete(userId);

    broadcast({
      type: "user-offline",
      userId,
      timestamp: new Date(),
    });
  });

  ws.on("error", (error) => {
    console.error(`[WebSocket] Error with user ${userId}:`, error);
  });
});

function broadcast(message) {
  connectedUsers.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
  });
}

// Health endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    uptime: process.uptime(),
    connectedUsers: connectedUsers.size,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🏠 HomeSafely Server Running    ║
║   Port: ${PORT}                         ║
║   Env: ${process.env.NODE_ENV || "development"}                      ║
╚════════════════════════════════════╝
  `);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = { app, server };