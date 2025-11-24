// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, firebaseLogin, logout, forgotPassword, checkResetToken, resetPassword, validateToken } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Rutas existentes
router.post('/register', register);
router.post('/login', login);

// Recuperar password
router.post("/forgotpassword", forgotPassword);

// Verificar token (para UI)
router.get("/reset-password/:token", checkResetToken);

// Cierre de sesión automático
router.post('/logout', auth, logout);

// Actualizar contraseña
router.post("/reset-password/:token", resetPassword);

// Login con Firebase (Google/Apple)
router.post('/firebase', firebaseLogin);

// Validar token para seguridad
router.get('/validate-token', auth, validateToken); 

module.exports = router;
