const express = require("express");
const router = express.Router();

// Importar middlewares
const { auth, isOwnerOrAdmin } = require("../middleware/auth");
const upload = require("../middleware/multer");

// Importar controladores
const {
  getUser,
  updateUser,
  updateSettings,
  changePassword,
  updateServices,
  removeService
} = require("../controllers/userController");

// Rutas
router.get("/:id", auth, getUser);
router.put("/:id", auth, isOwnerOrAdmin, upload.single("photo"), updateUser);

// Cambiar contraseña
router.post("/change-password", auth, changePassword);

// Actualizar configuración
router.put("/settings", auth, updateSettings);

// Ruta para servicios 
router.put("/services", auth, updateServices);

// Eliminar un servicio específico
router.delete("/services/:profession", auth, removeService);

module.exports = router;
