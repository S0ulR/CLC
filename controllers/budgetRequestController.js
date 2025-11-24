const BudgetRequest = require("../models/BudgetRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendNotificationEmail = require("../middleware/sendNotificationEmail");

// 📝 Crear una solicitud de presupuesto
exports.createBudgetRequest = async (req, res) => {
const { worker, profession, startDate, description, address, locality, province, country, urgent } = req.body;

const client = req.user.id;

// Verificar que el cliente exista
const clientUser = await User.findById(client);
if (!clientUser) {
  return res.status(400).json({ msg: "Cliente no válido" });
}

  try {
    const workerUser = await User.findById(worker);
    if (!workerUser || workerUser.role !== "worker") {
      return res.status(400).json({ msg: "Trabajador no válido" });
    }

    const clientUser = await User.findById(client);

const request = new BudgetRequest({
  client,
  worker,
  profession,
  startDate: startDate ? new Date(startDate) : undefined,
  description,
  address,
  locality,
  province,
  country,
  urgent,
});

    await request.save();

    // 🔔 Notificación al trabajador
    const notification = new Notification({
      user: worker,
      message: `📄 ${clientUser.name} te solicitó un presupuesto para: ${profession}`,
      type: "budget_request",
      relatedId: request._id,
      onModel: "BudgetRequest",
    });

    await notification.save();
    await sendNotificationEmail(notification);

    res.status(201).json({ msg: "Solicitud de presupuesto enviada", request });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// 📥 Obtener solicitudes recibidas (trabajador)
exports.getReceivedRequests = async (req, res) => {
  try {
    const requests = await BudgetRequest.find({ worker: req.user.id })
      .populate("client", "name photo profession")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// 📤 Obtener solicitudes enviadas (cliente)
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await BudgetRequest.find({ client: req.user.id })
      .populate("worker", "name photo profession rating")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// ✅ Responder a una solicitud
exports.respondToRequest = async (req, res) => {
  const { requestId } = req.params;
  const { message, budget, estimatedTime } = req.body;
  const workerId = req.user.id;

  try {
    const request = await BudgetRequest.findById(requestId).populate(
      "worker client"
    );

    if (!request) {
      return res.status(404).json({ msg: "Solicitud no encontrada" });
    }

    if (request.worker._id.toString() !== workerId) {
      return res.status(403).json({ msg: "No autorizado" });
    }

    request.status = "respondido";
    request.response = { message, budget, estimatedTime };

    await request.save();

    // 🔔 Notificación al cliente
    const notification = new Notification({
      user: request.client._id,
      message: `📬 ${request.worker.name} respondió a tu solicitud de presupuesto`,
      type: "budget_response",
      relatedId: request._id,
      onModel: "BudgetRequest",
    });

    await notification.save();
    await sendNotificationEmail(notification);

    res.json({ msg: "Respuesta enviada", request });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};
