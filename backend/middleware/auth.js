const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    console.log('[authMiddleware] Authorization header:', header.substring(0, 50) + '...');
    console.log('[authMiddleware] JWT_SECRET set:', !!process.env.JWT_SECRET);

    if (scheme !== "Bearer" || !token) {
      console.error('[authMiddleware] Invalid authorization format');
      return res.status(401).json({ error: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[authMiddleware] JWT_SECRET not set');
      return res.status(500).json({ error: "JWT_SECRET not set in environment" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[authMiddleware] Token verified successfully for user:', decoded.userId);

    // Attach user to request (handy for routes)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error('[authMiddleware] Token verification failed:', error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

module.exports = {
  authMiddleware,
  errorHandler,
};