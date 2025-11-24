// backend/utils/geocodingService.js
const axios = require("axios");

const USER_AGENT = "BilcaApp/1.0 (contacto@bilca.com)";

/**
 * Buscar direcciones por texto
 */
exports.searchAddress = async (query, country) => {
  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        format: "json",
        q: query,
        countrycodes: country,
        addressdetails: 1,
        limit: 5,
      },
      headers: { "User-Agent": USER_AGENT },
    }
  );

  if (response.data.length === 0) {
    throw new Error("No se encontraron resultados");
  }

  return response.data.map((item) => ({
    display_name: item.display_name,
    address: item.address || {},
  }));
};

/**
 * Reverse geocoding: coordenadas → dirección
 */
exports.reverseGeocode = async (lat, lon) => {
  const response = await axios.get(
    "https://nominatim.openstreetmap.org/reverse",
    {
      params: {
        format: "json",
        lat,
        lon,
        zoom: 18,
        addressdetails: 1,
      },
      headers: { "User-Agent": USER_AGENT },
    }
  );

  if (!response.data.address) {
    throw new Error("Dirección no encontrada");
  }

  const addr = response.data.address;
  return {
    display_name: response.data.display_name,
    address: {
      road: addr.road || addr.pedestrian || "",
      suburb: addr.suburb || "",
      town: addr.town || addr.city || addr.village || "",
      city: addr.city || addr.town || "",
      state: addr.state || "",
      country: addr.country || "Argentina",
      postcode: addr.postcode || "",
    },
  };
};
