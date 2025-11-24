// backend/jobs/sendReviewReminders.js
const Hire = require("../models/Hire");
const User = require("../models/User");
const { sendReviewReminderEmail } = require("../config/nodemailer");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, FRONTEND_URL } = process.env;

async function sendReviewReminders() {
  console.log("📅 Iniciando tarea de recordatorios de reseña...");

  // Calcular la fecha exacta: 10 días atrás
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  // Rango de tiempo para evitar errores de segundos (±1 hora)
  const startRange = new Date(tenDaysAgo.getTime() - 3600000); // -1h
  const endRange = new Date(tenDaysAgo.getTime() + 3600000);   // +1h

  try {
    // Buscar contrataciones completadas hace 10 días y sin reseña
    const hires = await Hire.find({
      status: "completado",
      completedAt: {
        $gte: startRange,
        $lte: endRange
      },
      "review.reviewedAt": { $exists: false } // Aún no ha sido valorado
    })
      .populate("client worker service");

    if (hires.length === 0) {
      console.log("✅ No hay trabajos para recordar reseña hoy.");
      return;
    }

    console.log(`📧 Enviando ${hires.length} recordatorios de reseña...`);

    for (const hire of hires) {
      try {
        // Generar token único para este cliente y contratación
        const reviewToken = jwt.sign(
          { hireId: hire._id, clientId: hire.client._id },
          JWT_SECRET,
          { expiresIn: "7d" } // Válido 7 días
        );

        const reviewLink = `${FRONTEND_URL}/review/${reviewToken}`;

        await sendReviewReminderEmail(
          hire.client.email,
          hire.client.name,
          hire.worker.name,
          hire.service || "Servicio",
          reviewLink
        );

        console.log(`✅ Email enviado a ${hire.client.email} para contratación ${hire._id}`);
      } catch (err) {
        console.error(`❌ Error al enviar email a ${hire.client.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error("❌ Error general en el job de reseñas:", err.message);
  }
}

module.exports = sendReviewReminders;
