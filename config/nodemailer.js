// backend/config/nodemailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// ⚙️ Validación de variables de entorno
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("⚠️ Advertencia: EMAIL_USER o EMAIL_PASS no están definidos en .env");
}

// 📬 Crear el transporter seguro
const transporter = nodemailer.createTransport({
  service: "gmail", // Cambiar si se usa otro proveedor (Outlook, SendGrid, etc.)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Usar App Password si hay 2FA
  },
  tls: {
    rejectUnauthorized: false, // Solo para desarrollo
  },
});

/**
 * 📨 Enviar email genérico (base de todas las demás funciones)
 * @param {Object} params
 * @param {string|string[]} params.to - Destinatario(s)
 * @param {string} params.subject - Asunto del correo
 * @param {string} [params.text] - Versión en texto plano
 * @param {string} [params.html] - Versión en HTML
 * @param {Array} [params.attachments] - Archivos adjuntos (opcional)
 */
const sendEmail = async ({ to, subject, text = "", html = "", attachments = [] }) => {
  if (!to || !subject) {
    throw new Error("Faltan campos obligatorios: 'to' o 'subject'");
  }

  const mailOptions = {
    from: `"Bilca" <${process.env.EMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text,
    html,
    attachments: attachments.length ? attachments : undefined, // ✅ solo si existen
    headers: {
      "X-Mailer": "BilcaApp/1.0",
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado exitosamente a ${to}`);
    console.log(`📧 ID del mensaje: ${info.messageId}`);
    console.log(`📦 Ver en Gmail: https://mail.google.com/mail/u/0/#sent/?search=${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar email:", error);

    // Clasificación de errores comunes
    if (error.responseCode === 535) {
      console.error("🔐 Error de autenticación: verifica EMAIL_USER y EMAIL_PASS (usa App Password si tienes 2FA)");
    } else if (error.code === "EAUTH") {
      console.error("🚫 No se pudo autenticar con el servidor SMTP");
    } else if (error.code === "ENOTFOUND") {
      console.error("🌐 No se pudo conectar al servidor de correo (verifica tu conexión)");
    }

    throw new Error(`No se pudo enviar el correo: ${error.message}`);
  }
};

// 📩 Funciones específicas reutilizando sendEmail
const sendWelcomeEmail = async (to, name) => {
  const html = `
    <h2>¡Bienvenido/a a Bilca, ${name}!</h2>
    <p>Gracias por registrarte. Ya puedes comenzar a buscar o ofrecer servicios cerca de ti.</p>
    <p><a href="https://bilca.com/dashboard" style="color: #4a9d9c;">Ir al dashboard →</a></p>
    <hr>
    <small>Si no te registraste tú, ignora este mensaje.</small>
  `;

  await sendEmail({
    to,
    subject: "🎉 Bienvenido/a a Bilca",
    text: `Hola ${name}, gracias por registrarte en Bilca.`,
    html,
  });
};

const sendPasswordResetEmail = async (to, resetLink) => {
  const html = `
    <h2>Restablece tu contraseña</h2>
    <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
    <p>
      <a 
        href="${resetLink}" 
        style="
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4a9d9c; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          font-weight: bold;
        "
      >
        Restablecer contraseña
      </a>
    </p>
    <p>Este enlace expira en 1 hora.</p>
    <hr>
    <small>Si no solicitaste esto, ignora el mensaje.</small>
  `;

  await sendEmail({
    to,
    subject: "🔐 Restablece tu contraseña de Bilca",
    text: `Haz clic aquí para restablecer tu contraseña: ${resetLink}`,
    html,
  });
};

const sendHireNotification = async (to, clientName, serviceName, hireLink) => {
  await sendEmail({
    to,
    subject: `💼 Nuevo trabajo: ${clientName} te contrató`,
    text: `${clientName} te ha contratado para "${serviceName}". Ve más detalles: ${hireLink}`,
    html: `
      <h2>💼 ¡Felicidades, tienes un nuevo trabajo!</h2>
      <p><strong>${clientName}</strong> te ha contratado para:</p>
      <h3>${serviceName}</h3>
      <p><a href="${hireLink}">Ver detalles del trabajo →</a></p>
    `,
  });
};

/**
 * 🔐 Enviar notificación de cambio de contraseña
 * @param {string} to - Email del usuario
 * @param {string} clientIp - IP del cliente (opcional)
 * @param {string} userAgent - Navegador/dispositivo (opcional)
 */
const sendPasswordChangedNotification = async (to, clientIp = "desconocida", userAgent = "desconocido") => {
  const formattedDate = new Date().toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const html = `
    <h2>🔐 Tu contraseña ha sido cambiada</h2>
    <p>Se actualizó la contraseña de tu cuenta en Bilca.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Fecha y hora:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>IP:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${clientIp}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Dispositivo:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${userAgent}</td>
      </tr>
    </table>

    <p>Si fuiste tú, puedes ignorar este mensaje.</p>
    <p><strong>Si no reconoces este cambio, inicia sesión de inmediato y cambia tu contraseña nuevamente.</strong></p>
    
    <hr>
    <small>Estás recibiendo este correo porque se cambió la contraseña de tu cuenta en Bilca.</small>
  `;

  await sendEmail({
    to,
    subject: "🔐 Notificación de seguridad: Contraseña actualizada",
    text: `Tu contraseña fue actualizada el ${formattedDate}. Si no fuiste tú, inicia sesión y cámbiala.`,
    html,
  });
};

const sendReviewReminderEmail = async (to, clientName, workerName, serviceName, reviewLink) => {
  const html = `
    <h2>⏱️ ¡Es hora de valorar tu experiencia!</h2>
    <p>Hola ${clientName},</p>
    <p>Hace unos días contrataste a <strong>${workerName}</strong> para el servicio de <em>${serviceName}</em>.</p>
    <p>Ayúdanos a mantener la calidad de nuestros profesionales dejando tu valoración y comentario.</p>
    <p>
      <a 
        href="${reviewLink}" 
        style="
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4a9d9c; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          font-weight: bold;
        "
      >
        Dejar reseña ahora
      </a>
    </p>
    <p>Este enlace expira en 7 días.</p>
    <hr>
    <small>Si ya dejaste tu reseña, ignora este mensaje.</small>
  `;

  await sendEmail({
    to,
    subject: `⭐ Valora tu experiencia con ${workerName}`,
    text: `Hola ${clientName}, deja tu reseña por ${workerName} aquí: ${reviewLink}`,
    html,
  });
};


module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendHireNotification,
  sendPasswordChangedNotification,
  sendReviewReminderEmail, 
};
