// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const path = require("path");
const cron = require("node-cron");

// Cargar variables de entorno
dotenv.config();

// Importar configuraciones
const connectDB = require("./config/db");
const setupSocket = require("./config/socket");

// Inicializar app
const app = express();
const server = http.createServer(app);

// Conectar a base de datos
connectDB();

// Configurar Socket.IO
const io = setupSocket(server);

// Middlewares de seguridad
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Parseo de cuerpo
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const sendReviewReminders = require("./jobs/sendReviewReminders");

// Programar tarea: cada día a las 00:00 (medianoche)
cron.schedule("0 0 * * *", sendReviewReminders);

// Servir archivos estáticos
// app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// Ruta base
app.get("/", (req, res) => {
  res.json({ message: "Bienvenido a Bilca API 🛠️" });
});

// -----------------------
// Rutas
// -----------------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/hires", require("./routes/hireRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/workers", require("./routes/workerRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/unsubscribe", require("./routes/unsubscribe"));
app.use("/api/budget-requests", require("./routes/budgetRequestRoutes"));
app.use("/api/geocode", require("./routes/geocodeRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ msg: "Ruta no encontrada" });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: "Error del servidor" });
});

// Puerto
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log("⏰ Cron job de reseñas programado para ejecutarse diariamente a medianoche.");
});

module.exports = server;
