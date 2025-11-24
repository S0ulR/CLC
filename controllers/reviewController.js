// backend/controllers/reviewController.js
const Hire = require("../models/Hire");
const Review = require("../models/Review"); 
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, FRONTEND_URL } = process.env;

// Validar token de reseña (público)
exports.validateReviewToken = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, JWT_SECRET);

    const hire = await Hire.findById(decoded.hireId)
      .populate('client worker service');

    if (!hire || hire.client._id.toString() !== decoded.clientId) {
      return res.status(400).json({ valid: false, msg: "Token inválido" });
    }

    if (hire.review?.reviewedAt) {
      return res.status(400).json({ valid: false, msg: "Ya has dejado tu reseña" });
    }

    if (!hire.completedAt) {
      return res.status(400).json({ valid: false, msg: "Trabajo no completado" });
    }

    const tenDaysAfter = new Date(hire.completedAt);
    tenDaysAfter.setDate(tenDaysAfter.getDate() + 10);

    if (new Date() < tenDaysAfter) {
      return res.status(400).json({ valid: false, msg: "Aún no es momento de valorar" });
    }

    res.json({
      valid: true,
      hire: {
        _id: hire._id,
        worker: {
          _id: hire.worker._id,
          name: hire.worker.name,
          photo: hire.worker.photo
        },
        service: hire.service || "Servicio",
        description: hire.description
      }
    });
  } catch (err) {
    res.status(400).json({ valid: false, msg: "Token inválido o expirado" });
  }
};

// Enviar reseña (público) - Ahora actualiza Hire y crea Review
exports.submitReview = async (req, res) => {
  const { token, rating, comment } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const hire = await Hire.findById(decoded.hireId);

    if (!hire || hire.client._id.toString() !== decoded.clientId) {
      return res.status(400).json({ msg: "Token inválido" });
    }

    if (hire.review?.reviewedAt) {
      return res.status(400).json({ msg: "Ya has enviado tu reseña" });
    }

    // Validar rating (1-5)
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ msg: "Calificación inválida" });
    }

    // Actualizar Hire
    hire.review = {
      rating,
      comment: comment?.trim().substring(0, 500) || "",
      reviewedAt: new Date()
    };
    await hire.save();

    // Crear Review
    const review = new Review({
      hire: hire._id,
      worker: hire.worker,
      user: hire.client,
      rating,
      comment
    });
    await review.save();

    // Actualizar promedio de rating del trabajador
    await updateWorkerRating(hire.worker);

    res.json({ msg: "¡Gracias por tu reseña!" });
  } catch (err) {
    res.status(400).json({ msg: "Error al enviar la reseña" });
  }
};

// Obtener reseñas de un trabajador (ahora desde modelo Review)
exports.getWorkerReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Contar total para paginación
    const total = await Review.countDocuments({ worker: id });
    const reviews = await Review.find({ worker: id })
      .populate("user", "name photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      reviews: reviews || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasPrev: page > 1,
        hasNext: page < Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error al obtener reseñas:", err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// Actualizar rating del trabajador
async function updateWorkerRating(workerId) {
  try {
    const reviews = await Review.find({ worker: workerId });
    if (reviews.length === 0) {
      await User.findByIdAndUpdate(workerId, { rating: 0 });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(workerId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalJobs: reviews.length
    });
  } catch (err) {
    console.error("Error al actualizar rating:", err);
  }
}
