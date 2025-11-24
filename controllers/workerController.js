// controllers/workerController.js
const User = require("../models/User");
const Review = require("../models/Review");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

// --- Función auxiliar: Haversine ---
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Obtener trabajadores ---
exports.getWorkers = async (req, res) => {
  try {
    const { profession, lat, lng, search, ubicacion } = req.query;

    // Filtro base: todos los workers públicos
    const query = {
      role: "worker",
      isPrivate: { $ne: true }, // Solo perfiles públicos
    };

    // Búsqueda de texto libre
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { "services.profession": regex },
        { "location.address": regex },
      ];
    }
    // Filtrar por profesión si no hay búsqueda libre
    else if (profession) {
      query["services.profession"] = profession;
    }

    // ✅ Filtro por ubicación (texto)
    if (ubicacion && ubicacion.trim()) {
      const cleanUbicacion = ubicacion.trim();
      const locationRegex = new RegExp(cleanUbicacion, "i"); // "i" para case-insensitive
      query["location.address"] = locationRegex;
    }

    let workers = await User.find(query).select("-password -reviews");

    // Calcular distancias si hay coordenadas
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      if (!isNaN(userLat) && !isNaN(userLng)) {
        workers = workers.map((worker) => {
          if (worker.location?.coordinates?.length === 2) {
            const [wLng, wLat] = worker.location.coordinates;
            const distance = getDistance(userLat, userLng, wLat, wLng);
            worker = worker.toObject();
            worker.distance = Math.round(distance * 10) / 10;
          }
          return worker;
        });

        // Ordenar por proximidad
        workers.sort((a, b) => {
          if (a.distance && b.distance) return a.distance - b.distance;
          return 0;
        });
      }
    }

    // Ordenar por rating si no hay ubicación ni búsqueda
    if ((!lat || !lng) && !search && !ubicacion) {
      workers.sort((a, b) => b.rating - a.rating);
    }

    res.json(workers);
  } catch (err) {
    console.error("Error al obtener trabajadores:", err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// --- Actualizar perfil como trabajador ---
exports.updateWorkerProfile = async (req, res) => {
  const { professions, bio, hourlyRate, address } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const validProfessions = [
      "plomero",
      "electricista",
      "niñero",
      "albañil",
      "jardinero",
      "carpintero",
      "pintor",
      "limpieza",
      "paseador de perros",
      "cuidadores de adultos",
      "mudanzas",
      "gasista",
    ];

    if (
      !Array.isArray(professions) ||
      professions.some((p) => !validProfessions.includes(p.toLowerCase()))
    ) {
      return res
        .status(400)
        .json({ msg: "Una o más profesiones no son válidas" });
    }

    user.role = "worker";
    user.professions = professions.map((p) => p.toLowerCase());
    if (bio) user.bio = bio;
    if (hourlyRate) user.hourlyRate = parseFloat(hourlyRate);
    if (address) user.location.address = address;

    await user.save();

    res.json({
      msg: "Perfil actualizado como trabajador",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        professions: user.professions,
        bio: user.bio,
        hourlyRate: user.hourlyRate,
        location: user.location,
        photo: user.photo,
        rating: user.rating,
        totalJobs: user.totalJobs,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// --- Obtener reseñas de un trabajador ---
exports.getWorkerReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ worker: id })
      .populate("user", "name photo")
      .sort({ createdAt: -1 });

    res.json(reviews || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// --- Obtener trabajador por ID ---
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id, "-password")
      .populate("reviews.user", "name photo")
      .populate("reviews");

    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ msg: "Trabajador no encontrado" });
    }

    res.json(worker);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};
