const { sendEmail } = require("../config/nodemailer");

exports.sendDocumentEmail = async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    const file = req.file;

    console.log("Archivo recibido:", req.file);

    if (!to || !subject) {
      return res.status(400).json({ msg: "Faltan campos obligatorios (to, subject)" });
    }

    // Si hay archivo adjunto, lo convertimos en attachment válido
    const attachments = file
      ? [
          {
            filename: file.originalname || "factura.pdf",
            content: file.buffer,
          },
        ]
      : [];

    await sendEmail({
      to,
      subject,
      html,
      attachments,
    });

    res.json({ msg: "Documento enviado por email correctamente." });
  } catch (err) {
    console.error("Error al enviar documento por email:", err);
    res.status(500).json({ msg: "Error al enviar el email." });
  }
};
