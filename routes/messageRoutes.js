const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { auth } = require("../middleware/auth");
const {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  uploadFile,
  getTypingStatus,
  startConversation,
  getFileById  // ← Controlador nuevo
} = require("../controllers/messageController");

// --- Rutas ---
router.post("/send", auth, sendMessage);
router.get("/conversations", auth, getConversations);
router.get("/:conversationId", auth, getMessages);
router.put("/:conversationId/read", auth, markAsRead);
router.post("/upload", auth, upload.single("file"), uploadFile);
router.get("/:conversationId/typing", auth, getTypingStatus);
router.post("/start", auth, startConversation);
router.get("/file/:messageId", auth, getFileById); 

module.exports = router;