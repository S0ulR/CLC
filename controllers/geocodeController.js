// controllers/geocodeController.js
const geocodingService = require("../utils/geocodingService");

exports.search = async (req, res) => {
  const { q, country = "AR" } = req.query;

  // ✅ Validación mejorada
  if (!q || typeof q !== "string" || q.trim().length < 3) {
    return res
      .status(400)
      .json({ msg: "La consulta debe tener al menos 3 caracteres" });
  }

  try {
    const cleanQuery = q.trim();
    const results = await geocodingService.searchAddress(cleanQuery, country);
    return res.json(results);
  } catch (err) {
    console.error("Error en búsqueda:", err.message);
    // ✅ Manejo de errores más específico
    if (err.message === "No se encontraron resultados") {
      return res.json([]); // Devolver array vacío en lugar de error 500
    }
    return res.status(500).json({ msg: "Error al buscar dirección" });
  }
};

exports.reverse = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ msg: "Coordenadas inválidas" });
  }

  try {
    const result = await geocodingService.reverseGeocode(
      parseFloat(lat),
      parseFloat(lon)
    );
    return res.json(result);
  } catch (err) {
    console.error("Error en reverse geocoding:", err.message);
    return res.status(500).json({ msg: "Error al obtener dirección" });
  }
};
