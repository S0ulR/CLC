// backend/controllers/messageController.js
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendNotificationEmail = require("../middleware/sendNotificationEmail");

// --- Enviar mensaje ---
exports.sendMessage = async (req, res) => {
  const { recipient, content } = req.body;
  const sender = req.user.id;

  try {
    if (!req.user || !sender) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    if (!recipient || !content?.trim()) {
      return res.status(400).json({ msg: "Faltan datos: recipient o content" });
    }

    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ msg: "Destinatario no encontrado" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [sender, recipient], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, recipient],
      });
    }

    const message = new Message({
      sender,
      recipient,
      content,
      conversation: conversation._id,
    });

    await message.save();

    conversation.lastMessage = message._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Notificación
    const notification = new Notification({
      user: recipient,
      message: `✉️ ${req.user.name} te envió un mensaje`,
      type: "message",
      relatedId: message._id,
      onModel: "Message",
    });

    await notification.save();
    await sendNotificationEmail(notification);

    // EMITIR MENSAJE EN TIEMPO REAL
    global.io?.to(conversation._id).emit("new_message", message);
    global.io?.to(recipient).emit("notification", {
      message: notification.message,
      type: "message"
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("Error en sendMessage:", err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
};

// --- Obtener conversaciones ---
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name photo")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// --- Obtener mensajes de una conversación ---
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name photo")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// --- Marcar como leído ---
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversation: conversationId, recipient: req.user.id },
      { read: true }
    );
    res.json({ msg: 'Mensajes marcados como leídos' });
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
};

// --- Subir archivo ---
exports.uploadFile = async (req, res) => {
  try {
    const { conversation: conversationId } = req.body;
    const file = req.file;

    if (!conversationId || !file) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: "Conversación no encontrada" });
    }

    const recipient = conversation.participants.find(p => p.toString() !== req.user.id);
    if (!recipient) {
      return res.status(400).json({ msg: "No se pudo determinar el destinatario" });
    }

    // Determinar tipo
    const isImage = file.mimetype.startsWith('image');
    const fileType = isImage ? 'image' : 'pdf';

    // Crear mensaje con archivo en binario
    const message = new Message({
      sender: req.user.id,
      recipient: recipient,
      content: file.originalname,
      conversation: conversationId,
      file: {
        data: file.buffer,                   // ← Acá va el archivo completo
        name: file.originalname,
        type: fileType,
        contentType: file.mimetype
      }
    });

    await message.save();

    // Actualizar conversación
    conversation.lastMessage = message._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Notificación
    const notification = new Notification({
      user: recipient,
      message: `📎 ${req.user.name} te envió un archivo`,
      type: "message",
      relatedId: message._id,
      onModel: "Message",
    });

    await notification.save();
    await sendNotificationEmail(notification);

    // Emitir vía Socket.IO
    global.io?.to(conversationId).emit("new_message", message);
    global.io?.to(recipient.toString()).emit("notification", {
      message: notification.message,
      type: "message"
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("Error al subir archivo:", err.message);
    res.status(500).send("Error al subir archivo");
  }
};

// --- Estado de escritura (simulado) ---
exports.getTypingStatus = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Placeholder: en producción, esto vendrá de Socket.IO
    res.json({
      typing: false,
      sender: null,
      senderName: ""
    });
  } catch (err) {
    res.status(500).send("Error del servidor");
  }
};

// --- Iniciar conversación ---
exports.startConversation = async (req, res) => {
  const { recipient, content } = req.body;
  const sender = req.user.id;

  try {
    if (!req.user || !sender) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    if (!recipient || !content?.trim()) {
      return res.status(400).json({ msg: "Faltan datos: recipient o content" });
    }

    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ msg: "Destinatario no encontrado" });
    }

    // Buscar o crear conversación
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, recipient], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, recipient],
      });
    }

    // Crear mensaje
    const message = new Message({
      sender,
      recipient,
      content,
      conversation: conversation._id,
    });

    await message.save();

    // Actualizar última conversación
    conversation.lastMessage = message._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Notificación
    const notification = new Notification({
      user: recipient,
      message: `✉️ ${req.user.name} inició una conversación contigo`,
      type: "message",
      relatedId: message._id,
      onModel: "Message",
    });

    await notification.save();
    await sendNotificationEmail(notification);

    // Emitir en tiempo real
    global.io?.to(conversation._id).emit("new_message", message);
    global.io?.to(recipient).emit("notification", {
      message: notification.message,
      type: "message"
    });

    // Responder con el mensaje (frontend puede redirigir)
    res.status(201).json(message);
  } catch (err) {
    console.error("Error en startConversation:", err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
};

// --- Obtener archivo con autenticación ---
exports.getFileById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Buscar el mensaje
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: "Mensaje no encontrado" });
    }

    // Verificar que el usuario pertenece a la conversación
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ msg: "Acceso denegado a este archivo" });
    }

    // Verificar que hay un archivo
    if (!message.file || !message.file.data) {
      return res.status(404).json({ msg: "Archivo no encontrado" });
    }

    // Enviar el archivo
    res.set("Content-Type", message.file.contentType);
    res.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(message.file.name)}"`
    );
    res.send(message.file.data); // ← Enviamos el binario
  } catch (err) {
    console.error("Error al servir archivo:", err.message);
    res.status(500).send("Error del servidor");
  }
};
