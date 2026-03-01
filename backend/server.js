const path = require("path");
const express = require("express");
const cors = require("cors");
const expressWs = require("express-ws");
const http = require("http");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const { authMiddleware, errorHandler } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);

expressWs(app, server);

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow both Next.js (3000) and Vite (5173) in development
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, testRunner)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Public routes (no auth required) ─────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users")); // POST /api/users is public signup

// ── Protected routes ──────────────────────────────────────────────────────────
app.use("/api/posts", authMiddleware, require("./routes/posts"));
app.use("/api/messages", authMiddleware, require("./routes/messages"));
app.use("/api/recommendations", authMiddleware, require("./routes/recommendations"));

// ── WebSocket – real-time messaging ──────────────────────────────────────────
const connectedUsers = new Map();

app.ws("/ws/messages/:userId", (ws, req) => {
  const { userId } = req.params;
  console.log(`[WS] User ${userId} connected`);
  connectedUsers.set(userId, ws);

  broadcast({ type: "user-online", userId, timestamp: new Date() });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data?.recipientId && connectedUsers.has(data.recipientId)) {
        connectedUsers.get(data.recipientId).send(
          JSON.stringify({
            ...data,
            senderId: userId,
            type: "message",
            timestamp: new Date(),
          })
        );
      }
    } catch (err) {
      console.error("[WS] Parse error:", err.message);
    }
  });

  ws.on("close", () => {
    console.log(`[WS] User ${userId} disconnected`);
    connectedUsers.delete(userId);
    broadcast({ type: "user-offline", userId, timestamp: new Date() });
  });

  ws.on("error", (err) => {
    console.error(`[WS] Error for user ${userId}:`, err.message);
  });
});

function broadcast(message) {
  connectedUsers.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
  });
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    uptime: process.uptime(),
    connectedUsers: connectedUsers.size,
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── 404 + error handlers ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   🚗  Hitch Server Running           ║
║   Port : ${PORT}                          ║
║   Env  : ${(process.env.NODE_ENV || "development").padEnd(12)}          ║
╚══════════════════════════════════════╝`);
  console.log(`API       : http://localhost:${PORT}/api`);
  console.log(`WebSocket : ws://localhost:${PORT}/ws/messages/<userId>`);
  console.log(`Health    : http://localhost:${PORT}/health`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM – shutting down...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

module.exports = { app, server };