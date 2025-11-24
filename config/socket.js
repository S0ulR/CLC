// backend/config/socket.js
const setupSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const activeUsers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.query.userId;

    if (!userId) {
      return next(new Error("Usuario no autenticado"));
    }

    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    if (activeUsers.has(userId)) {
      io.sockets.sockets.get(activeUsers.get(userId))?.disconnect(true);
    }
    activeUsers.set(userId, socket.id);

    socket.on("join", (room) => {
      socket.join(room);
    });

    socket.on("typing", ({ conversationId, userId, userName }) => {
      socket.to(conversationId).emit("user_typing", { conversationId, userId, userName });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user_stopped_typing", { conversationId });
    });

    socket.on("message_read", ({ messageId, conversationId }) => {
      socket.to(conversationId).emit("message_read", { messageId, conversationId });
    });

    socket.on("disconnect", () => {
      if (activeUsers.get(userId) === socket.id) {
        activeUsers.delete(userId);
      }
    });
  });

  global.io = io;
  return io;
};

module.exports = setupSocket;
