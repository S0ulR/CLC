// backend/controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// -------------------------
// Helper: normalizar servicios
// -------------------------
const normalizeServices = (services = []) => {
  if (!Array.isArray(services)) return [];
  return services.map((s) => ({
    profession: s.profession || "",
    // si viene como string convertible a número, forzamos Number
    hourlyRate:
      s.hourlyRate === undefined || s.hourlyRate === null
        ? 0
        : Number(s.hourlyRate),
    bio: s.bio || "",
  }));
};

// -------------------------
// Obtener usuario por ID
// -------------------------
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      city: user.city,
      country: user.country,
      phone: user.phone,
      birthday: user.birthday,
      bio: user.bio,
      hourlyRate: user.hourlyRate,
      location: user.location,
      rating: user.rating,
      totalJobs: user.totalJobs,
      profileCompleted: user.profileCompleted,
      emailNotifications: user.emailNotifications,
      isPrivate: user.isPrivate,
      services: normalizeServices(user.services),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// -------------------------
// Actualizar usuario (ahora acepta services también)
// -------------------------
exports.updateUser = async (req, res) => {
  // Nota: si usás multipart/form-data, services puede venir como JSON string
  let { name, city, country, phone, birthday, bio, hourlyRate, address, services } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Campos básicos (solo si vienen)
    if (name) user.name = name;
    if (city) user.city = city;
    if (country) user.country = country;
    if (phone) user.phone = phone;
    if (birthday) user.birthday = new Date(birthday);
    if (bio !== undefined) user.bio = bio;
    if (hourlyRate !== undefined) user.hourlyRate = parseFloat(hourlyRate);

    // Dirección
    if (address) {
      if (!user.location) user.location = {};
      user.location.address = address;
    }

    // Foto (multer)
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "bilca/avatars",
          public_id: `user_${user._id}`,
          width: 200,
          height: 200,
          crop: "thumb",
          gravity: "face",
          format: "webp",
          quality: "auto:good",
        });

        user.photo = result.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
      } finally {
        // eliminar temporal si existe
        if (req.file && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch(e) { /* ignore */ }
        }
      }
    }

    // -------------------------
    // Si vienen services (pueden venir como JSON string en multipart)
    // -------------------------
    if (services !== undefined) {
      // intentar parsear si es string (caso multipart/form-data)
      if (typeof services === "string") {
        try {
          services = JSON.parse(services);
        } catch (e) {
          // si no se puede parsear, rechazamos
          return res.status(400).json({ msg: "Formato inválido para services" });
        }
      }

      // validar estructura básica
      if (!Array.isArray(services)) {
        return res.status(400).json({ msg: "Los servicios deben ser una lista" });
      }

      const validProfessions = [
        "plomero", "electricista", "niñero", "albañil", "jardinero",
        "carpintero", "pintor", "limpieza", "paseador de perros",
        "cuidadores de adultos", "mudanzas", "gasista"
      ];

      // validaciones por servicio
      for (let s of services) {
        if (!s.profession || !validProfessions.includes(s.profession)) {
          return res.status(400).json({ msg: `Oficio no válido: ${s.profession}` });
        }
        if (s.hourlyRate === undefined || Number(s.hourlyRate) < 0) {
          return res.status(400).json({ msg: "La tarifa por hora es inválida" });
        }
        if (s.bio !== undefined && typeof s.bio !== "string") {
          return res.status(400).json({ msg: "La biografía debe ser texto" });
        }
      }

      // detectar duplicados
      const professions = services.map(s => s.profession);
      const duplicates = professions.filter((p, i) => professions.indexOf(p) !== i);
      if (duplicates.length > 0) {
        return res.status(400).json({
          msg: `Ya estás ofreciendo este servicio: ${duplicates.join(", ")}. No puedes repetirlo.`
        });
      }

      // asignar normalizado
      user.services = normalizeServices(services);
      user.role = user.services.length > 0 ? "worker" : "user";
    }

    // Verificar si el perfil está completo (misma lógica que tenías)
    const isProfileComplete =
      user.name &&
      user.city &&
      user.country &&
      user.phone &&
      user.birthday &&
      !["Ciudad temporal", "No especificada"].includes(String(user.city || "").trim()) &&
      !["País temporal", "No especificado"].includes(String(user.country || "").trim()) &&
      user.phone !== "123456789" &&
      new Date(user.birthday).getFullYear() !== 1990;

    user.profileCompleted = !!isProfileComplete;

    // Guardar
    await user.save();

    // Responder con user completo (services normalizados)
    res.json({
      msg: "Perfil actualizado correctamente",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        city: user.city,
        country: user.country,
        phone: user.phone,
        birthday: user.birthday,
        bio: user.bio,
        hourlyRate: user.hourlyRate,
        location: user.location,
        rating: user.rating,
        totalJobs: user.totalJobs,
        profileCompleted: user.profileCompleted,
        emailNotifications: user.emailNotifications,
        isPrivate: user.isPrivate,
        services: normalizeServices(user.services),
      },
    });
  } catch (err) {
    console.error("Error en updateUser:", err.message || err);
    res.status(500).json({ msg: "Error del servidor al actualizar el perfil" });
  }
};

// -------------------------
// Actualizar configuración
// -------------------------
exports.updateSettings = async (req, res) => {
  const { emailNotifications, isPrivate } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    await user.save();

    res.json({
      msg: "Configuración actualizada",
      settings: {
        emailNotifications: user.emailNotifications,
        isPrivate: user.isPrivate,
      },
      user: {
        _id: user._id,
        profileCompleted: user.profileCompleted,
        services: normalizeServices(user.services),
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// -------------------------
// Cambiar contraseña
// -------------------------

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  console.log(" Campos recibidos en changePassword:", { currentPassword, newPassword });

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: "Faltan campos obligatorios: currentPassword o newPassword." });
  }

  const userId = req.user.id;

  try {
    // ✅ Asegurarse de seleccionar el campo password
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password); // ← user.password ya no es undefined
    if (!isMatch) {
      return res.status(400).json({ msg: "La contraseña actual es incorrecta" });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en changePassword:", err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// -------------------------
// Actualizar servicios (ruta separada)
// -------------------------
exports.updateServices = async (req, res) => {
  const { services } = req.body;
  const userId = req.user.id;

  console.log("🔹 updateServices llamado");
  console.log("🔹 Token recibido:", req.header("x-auth-token"));
  console.log("🔹 Usuario autenticado (req.user):", req.user);

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const validProfessions = [
      "plomero", "electricista", "niñero", "albañil", "jardinero",
      "carpintero", "pintor", "limpieza", "paseador de perros",
      "cuidadores de adultos", "mudanzas", "gasista"
    ];

    // Validar que sea array
    if (!Array.isArray(services)) {
      return res.status(400).json({ msg: "Los servicios deben ser una lista" });
    }

    // Validar cada servicio
    for (let s of services) {
      if (!s.profession || !validProfessions.includes(s.profession)) {
        return res.status(400).json({ msg: `Oficio no válido: ${s.profession}` });
      }
      if (s.hourlyRate === undefined || Number(s.hourlyRate) < 0) {
        return res.status(400).json({ msg: "La tarifa por hora es inválida" });
      }
      if (s.bio !== undefined && typeof s.bio !== "string") {
        return res.status(400).json({ msg: "La biografía debe ser texto" });
      }
    }

    // Detectar duplicados
    const professions = services.map(s => s.profession);
    const duplicates = professions.filter((p, i) => professions.indexOf(p) !== i);

    if (duplicates.length > 0) {
      return res.status(400).json({
        msg: `Ya estás ofreciendo este servicio: ${duplicates.join(", ")}. No puedes repetirlo.`,
      });
    }

    // Actualizar servicios (normalizados)
    user.services = normalizeServices(services);
    user.role = user.services.length > 0 ? "worker" : "user";

    // Marcar como completado si tiene datos válidos
    const isProfileComplete =
      user.name &&
      user.city &&
      user.country &&
      user.phone &&
      user.birthday &&
      !["Ciudad temporal", "No especificada"].includes(String(user.city || "").trim()) &&
      !["País temporal", "No especificado"].includes(String(user.country || "").trim()) &&
      user.phone !== "123456789" &&
      new Date(user.birthday).getFullYear() !== 1990;

    if (isProfileComplete && !user.profileCompleted) {
      user.profileCompleted = true;
    }

    await user.save();

    // Respuesta consistente
    res.json({
      msg: "Servicios actualizados correctamente",
      user: {
        _id: user._id,
        role: user.role,
        services: normalizeServices(user.services),
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// -------------------------
// Eliminar un servicio específico
// -------------------------
exports.removeService = async (req, res) => {
  const { profession } = req.params;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const validProfessions = [
      "plomero", "electricista", "niñero", "albañil", "jardinero",
      "carpintero", "pintor", "limpieza", "paseador de perros",
      "cuidadores de adultos", "mudanzas", "gasista"
    ];

    if (!validProfessions.includes(profession)) {
      return res.status(400).json({ msg: "Profesión no válida" });
    }

    const currentServices = Array.isArray(user.services) ? user.services : [];
    const filteredServices = currentServices.filter(s => s.profession !== profession);

    if (filteredServices.length === currentServices.length) {
      return res.status(404).json({ msg: `No tienes un servicio de "${profession}" para eliminar.` });
    }

    user.services = filteredServices;

    // Si ya no tiene servicios, volver a rol "user"
    if (user.services.length === 0) {
      user.role = "user";
    }

    // Actualizar profileCompleted si es necesario
    const isProfileComplete =
      user.name &&
      user.city &&
      user.country &&
      user.phone &&
      user.birthday &&
      !["Ciudad temporal", "No especificada"].includes(String(user.city || "").trim()) &&
      !["País temporal", "No especificado"].includes(String(user.country || "").trim()) &&
      user.phone !== "123456789" &&
      new Date(user.birthday).getFullYear() !== 1990;

    if (isProfileComplete && !user.profileCompleted) {
      user.profileCompleted = true;
    }

    await user.save();

    res.json({
      msg: `Servicio de "${profession}" eliminado correctamente`,
      user: {
        _id: user._id,
        role: user.role,
        services: normalizeServices(user.services),
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
};
