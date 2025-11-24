// backend/controllers/unsubscribeController.js
const User = require("../models/User");
const generateUnsubscribeToken = require("../middleware/generateUnsubscribeToken");

// Desactivar notificaciones por email
exports.unsubscribeNotifications = async (req, res) => {
  const { userId, token } = req.query;

  try {
    // Validar que existan parámetros
    if (!userId || !token) {
      return res.status(400).send(`
        <h3>Enlace inválido</h3>
        <p>El enlace no es válido. Por favor, verifica que estés usando el enlace completo.</p>
      `);
    }

    // Generar token esperado
    const expectedToken = generateUnsubscribeToken(userId);

    if (token !== expectedToken) {
      return res.status(400).send(`
        <h3>Enlace no válido o expirado</h3>
        <p>El enlace de desactivación no es válido. Si necesitas ayuda, contáctanos.</p>
      `);
    }

    // Buscar y actualizar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("<h3>Usuario no encontrado</h3>");
    }

    if (!user.emailNotifications) {
      return res.send(`
        <h3>Notificaciones ya desactivadas</h3>
        <p>Ya no recibes notificaciones por email.</p>
      `);
    }

    // Desactivar notificaciones
    user.emailNotifications = false;
    await user.save();

    // Respuesta HTML amigable
    res.send(`
      <div style="font-family: 'Open Sans', sans-serif; text-align: center; max-width: 500px; margin: auto; padding: 2rem;">
        <h2 style="color: #2c3e50;">Notificaciones desactivadas</h2>
        <p>Hemos dejado de enviarte notificaciones por correo electrónico.</p>
        <p>Puedes volver a activarlas en cualquier momento en la sección de <strong>Configuración</strong> de tu cuenta.</p>
        <hr style="margin: 2rem 0; border: 1px solid #eee;" />
        <small style="color: #6c757d;">© 2025 Bilca. Todos los derechos reservados.</small>
      </div>
    `);
  } catch (err) {
    console.error("Error en unsubscribe:", err);
    res.status(500).send("<h3>Error del servidor</h3>");
  }
};
