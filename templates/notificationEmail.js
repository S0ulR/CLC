// backend/templates/notificationEmail.js
const notificationEmailTemplate = (user, notification) => {
  const token = generateUnsubscribeToken(user._id); // Asegúrate de importarlo
  const unsubscribeLink = `http://localhost:3000/api/unsubscribe/notifications?userId=${user._id}&token=${token}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nueva notificación - Bilca</title>
      <style>
        body { font-family: 'Open Sans', sans-serif; color: #2c3e50; line-height: 1.6; }
        .container { max-width: 600px; margin: auto; padding: 20px; }
        .header { background: #4a9d9c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; border: 1px solid #ddd; }
        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.9em; }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background: #4a9d9c;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
        .unsubscribe {
          font-size: 0.8em;
          color: #6c757d;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Tienes una nueva notificación!</h1>
        </div>
        <div class="content">
          <p>Hola ${user.name},</p>
          <p>Tienes una nueva notificación en tu cuenta:</p>
          <blockquote style="border-left: 4px solid #4a9d9c; padding-left: 10px; margin: 10px 0;">
            ${notification.message}
          </blockquote>
          <a href="http://localhost:3000/dashboard/notifications" class="btn">Ver notificaciones</a>   
        </div>
        <div class="footer">
          <p>© 2025 Bilca. Todos los derechos reservados.</p>
          <p class="unsubscribe">
            No deseas recibir estos correos? 
            <a href="${unsubscribeLink}" style="color: #dc3545;">Desactivar notificaciones</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = notificationEmailTemplate;

//MODIFICAR href="http://localhost:3000/dashboard/notifications"
