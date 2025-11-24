// routes/workerRoutes.js
const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const {
  getWorkers,
  updateWorkerProfile,
  getWorkerById,
} = require("../controllers/workerController");

// Ruta pública: ver perfil del trabajador
router.get("/:id", getWorkerById); // ← Sin auth

// Ruta pública: listar trabajadores
router.get("/", getWorkers);

// Rutas protegidas
router.put("/profile", auth, updateWorkerProfile);

module.exports = router;
