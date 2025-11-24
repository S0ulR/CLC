// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = process.env;


// ✅ Middleware: autenticación y validación de sesión
exports.auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  const sessionId = req.header('x-session-id'); // Nuevo header para el session_id

  if (!token) {
    return res.status(401).json({ msg: 'No hay token, acceso denegado' });
  }

  if (!sessionId) {
    return res.status(401).json({ msg: 'No hay session_id, acceso denegado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'Usuario no encontrado' });
    }

    // Validar que el session_id coincida
    if (user.activeSessionId !== sessionId) {
      return res.status(401).json({ msg: 'Sesión inválida o cerrada en otro dispositivo' });
    }

    req.user = {
      id: decoded.user.id,
      role: decoded.user.role,
    };

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token no válido o sesión inválida' });
  }
};

// ✅ Middleware: dueño o admin
exports.isOwnerOrAdmin = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  if (userId === id || role === 'admin') {
    return next();
  }

  return res.status(403).json({ msg: 'Acceso denegado' });
};
