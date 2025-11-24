// backend/controllers/invoiceController.js
const { sendEmail } = require("../config/nodemailer");

exports.sendInvoiceEmail = async (req, res) => {
  const { client, worker, invoiceNumber, totalAmount } = req.body;

  try {
    const html = `
      <h2>Factura ${invoiceNumber}</h2>
      <p>Hola <strong>${client.name}</strong>,</p>
      <p>Adjunto encontrarás la factura por servicios prestados por <strong>${worker.name}</strong>.</p>
      <p><strong>Total: $${totalAmount}</strong></p>
      <p>Gracias por su pago.</p>
      <hr>
      <small>Este correo fue generado automáticamente. No responda este mensaje.</small>
    `;

    await sendEmail({
      to: client.email,
      subject: `Factura ${invoiceNumber} - ${worker.name}`,
      html,
    });

    res.json({ msg: "Factura enviada por email correctamente." });
  } catch (err) {
    console.error("Error al enviar factura por email:", err);
    res.status(500).json({ msg: "Error al enviar el email." });
  }
};
