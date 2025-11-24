// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const { validateReviewToken, submitReview, getWorkerReviews } = require("../controllers/reviewController");

// Rutas públicas para reseña post-trabajo
router.get("/validate/:token", validateReviewToken);
router.post("/submit", submitReview);

// Ruta protegida para ver reseñas de un trabajador
router.get("/workers/:id/reviews", getWorkerReviews);

module.exports = router;