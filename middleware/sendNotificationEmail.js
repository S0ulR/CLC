// backend/middleware/sendNotificationEmail.js
const User = require("../models/User");
const { sendEmail } = require("../config/nodemailer");
const notificationEmailTemplate = require("../templates/notificationEmail");
const generateUnsubscribeToken = require("./generateUnsubscribeToken");

const sendNotificationEmail = async (notification) => {
  try {
    const user = await User.findById(notification.user).select("name email emailNotifications");
    
    if (!user || !user.email || !user.emailNotifications) {
      return;
    }

    const token = generateUnsubscribeToken(user._id.toString());
    const html = notificationEmailTemplate(user, notification, token);
    const text = `Tienes una nueva notificación: ${notification.message}`;

    await sendEmail(user.email, "Nueva notificación - Bilca", text, html);
  } catch (error) {
    console.error("Error al enviar email de notificación:", error);
  }
};

module.exports = sendNotificationEmail;