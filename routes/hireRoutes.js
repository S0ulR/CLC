const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const {
  createHire,
  getHires,
  updateStatus,
  markAsCompleted,
} = require("../controllers/hireController");

// Crear contratación
router.post("/create", auth, createHire);

// Obtener contrataciones del usuario
router.get("/", auth, getHires);

router.put("/:id/status", auth, updateStatus);

router.put("/:id/status/completed", auth, markAsCompleted);

module.exports = router;
