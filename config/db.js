// backend/config/db.js
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Opciones modernas (sin deprecated)
    });

    console.log(`✅ Conectado a MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    process.exit(1); // Detener la app si no hay DB
  }
};

module.exports = connectDB;
