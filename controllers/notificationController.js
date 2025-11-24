// backend/controllers/notificationController.js
const Notification = require("../models/Notification");

// ✅ Obtener notificaciones
exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.id }).sort({
      read: 1,
      createdAt: -1,
    });
    res.json(notifs);
  } catch (err) {
    console.error("Error al obtener notificaciones:", err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// ✅ Marcar como leídas
exports.markAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await Notification.updateMany(
        { _id: { $in: ids }, user: req.user.id },
        { read: true }
      );
    } else {
      await Notification.updateMany(
        { user: req.user.id, read: false },
        { read: true }
      );
    }

    res.status(200).json({ msg: "Notificaciones marcadas como leídas" });
  } catch (err) {
    console.error("Error al marcar como leído:", err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// ✅ Eliminar notificaciones
exports.deleteNotifications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ msg: "IDs requeridos" });
    }

    const result = await Notification.deleteMany({
      _id: { $in: ids },
      user: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ msg: "No se encontraron notificaciones para eliminar" });
    }

    res.status(200).json({ msg: "Notificaciones eliminadas permanentemente" });
  } catch (err) {
    console.error("Error al eliminar notificaciones:", err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// ✅ Eliminar todas
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id });

    if (result.deletedCount === 0) {
      return res
        .status(200)
        .json({ msg: "No había notificaciones para eliminar" });
    }

    res.status(200).json({ msg: "Todas las notificaciones eliminadas" });
  } catch (err) {
    console.error("Error al eliminar todas:", err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

const { sendHireNotification } = require("../config/nodemailer");

exports.sendHireNotification = async (req, res) => {
  try {
    const { to, clientName, serviceName, hireLink } = req.body;

    if (!to || !clientName || !serviceName || !hireLink) {
      return res
        .status(400)
        .json({ msg: "Faltan campos obligatorios para la notificación" });
    }

    await sendHireNotification(to, clientName, serviceName, hireLink);

    res.json({ msg: "Notificación de contratación enviada correctamente." });
  } catch (err) {
    console.error("Error al enviar notificación de contratación:", err);
    res.status(500).json({ msg: "Error al enviar la notificación." });
  }
};
