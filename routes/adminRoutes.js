const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth"); // Asegúrate de importar auth
const {
  getUsers,
  updateUserRole,
  getStats,
} = require("../controllers/adminController");

// Middleware: auth + solo admin
router.use(auth); // primero autenticación
router.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ msg: "Acceso denegado: solo administradores" });
  }
  next();
});

// Rutas
router.get("/users", getUsers);
router.put("/users/:id", updateUserRole);
router.get("/stats", getStats);

module.exports = router;
