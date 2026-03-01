// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const expressWs = require("express-ws");
const http = require("http");

const { authMiddleware, errorHandler } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);

// Initialize express-ws
expressWs(app, server);

// Config
const frontendOrigin = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", authMiddleware, require("./routes/posts"));
app.use("/api/users", authMiddleware, require("./routes/users"));
app.use("/api/messages", authMiddleware, require("./routes/messages"));
app.use("/api/recommendations", authMiddleware, require("./routes/recommendations"));

// ✅ Mount gemini router at /api/gemini
// Inside gemini.js we define router.post("/chat", ...)
app.use("/api/gemini", require("./routes/gemini"));

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket for real-time messaging
// ─────────────────────────────────────────────────────────────────────────────

const connectedUsers = new Map(); // userId -> ws

app.ws("/ws/messages/:userId", (ws, req) => {
  const { userId } = req.params;

  // OPTIONAL: enforce auth for websockets
  // If you pass token via query like ws://.../ws/messages/123?token=...
  // you can verify it here and refuse if invalid.
  // const token = req.query?.token;
  // if (!token) return ws.close(1008, "Missing token");

  console.log(`[WebSocket] User ${userId} connected`);

  // Replace any existing connection for this user
  const existing = connectedUsers.get(userId);
  if (existing && existing.readyState === 1) {
    try {
      existing.close(1000, "Replaced by new connection");
    } catch {}
  }
  connectedUsers.set(userId, ws);

  broadcast({
    type: "user-online",
    userId,
    timestamp: new Date().toISOString(),
  });

  ws.on("message", (msg) => {
    try {
      const text = Buffer.isBuffer(msg) ? msg.toString("utf8") : String(msg);
      const data = JSON.parse(text);

      // Expected: { recipientId, ... }
      const recipientId = String(data?.recipientId ?? "");
      if (!recipientId) {
        return; // ignore malformed message
      }

      console.log(`[WebSocket] Message from ${userId} -> ${recipientId}`);

      const recipientWs = connectedUsers.get(recipientId);
      if (recipientWs && recipientWs.readyState === 1) {
        recipientWs.send(
          JSON.stringify({
            ...data,
            senderId: userId,
            type: "message",
            timestamp: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      console.error("[WebSocket] Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`[WebSocket] User ${userId} disconnected`);
    const current = connectedUsers.get(userId);
    if (current === ws) connectedUsers.delete(userId);

    broadcast({
      type: "user-offline",
      userId,
      timestamp: new Date().toISOString(),
    });
  });

  ws.on("error", (error) => {
    console.error(`[WebSocket] Error with user ${userId}:`, error);
  });
});

// Helper function to broadcast messages to all connected users
function broadcast(message) {
  const payload = JSON.stringify(message);
  connectedUsers.forEach((socket) => {
    // ✅ In ws, OPEN is 1; ws.OPEN on instance is NOT correct
    if (socket && socket.readyState === 1) {
      try {
        socket.send(payload);
      } catch {}
    }
  });
}

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connectedUsers: connectedUsers.size,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

// Start
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🚗 Hitch Server Running           ║
║   Port: ${PORT}                         ║
║   Env: ${process.env.NODE_ENV || "development"}                 ║
╚════════════════════════════════════╝
  `);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws/messages/:userId`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = { app, server };