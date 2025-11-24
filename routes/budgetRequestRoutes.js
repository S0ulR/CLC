const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  createBudgetRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
} = require("../controllers/budgetRequestController");

// Enviar solicitud
router.post("/create", auth, createBudgetRequest);

// Recibidas (trabajador)
router.get("/received", auth, getReceivedRequests);

// Enviadas (cliente)
router.get("/sent", auth, getSentRequests);

// Responder solicitud
router.post("/respond/:requestId", auth, respondToRequest);

module.exports = router;
