const sendNotificationEmail = require('../middleware/sendNotificationEmail');
const Notification = require('../models/Notification');
const Hire = require('../models/Hire');
const User = require('../models/User');

// Crear una nueva contratación
exports.createHire = async (req, res) => {
  const { worker, service, description, budget } = req.body;
  const client = req.user.id;

  try {
    const workerUser = await User.findById(worker);
    if (!workerUser || workerUser.role !== 'worker') {
      return res.status(400).json({ msg: 'Trabajador no válido' });
    }

    const clientUser = await User.findById(client);
    if (!clientUser) {
      return res.status(400).json({ msg: 'Cliente no válido' });
    }

    const hire = new Hire({
      worker,
      client,
      service,
      description,
      budget,
      status: 'pendiente'
    });

    await hire.save();

    // ✅ Notificación segura
    try {
      const notification = new Notification({
        user: worker,
        message: `📩 ${clientUser.name} te ha contratado para: ${service}`,
        type: 'hire',
        relatedId: hire._id,
        onModel: 'Hire',
      });

      await notification.save();

      if (typeof sendNotificationEmail === 'function') {
        await sendNotificationEmail(notification);
      }
    } catch (notifErr) {
      console.error("Error al guardar notificación:", notifErr);
    }

    res.status(201).json({ msg: 'Contratación creada', hire });
  } catch (err) {
    console.error("Error en createHire:", err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
};

// Obtener contrataciones del usuario
exports.getHires = async (req, res) => {
  try {
    const { page = 1, limit = 3 } = req.query;
    const skip = (page - 1) * limit;

    const hires = await Hire.find({
      $or: [{ client: req.user.id }, { worker: req.user.id }]
    })
      .populate('worker', 'name profession photo rating')  
      .populate('client', 'name photo')                   
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Hire.countDocuments({
      $or: [{ client: req.user.id }, { worker: req.user.id }]
    });

    res.json({
      hires,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body; // aceptado, rechazado, completado
  const { id } = req.params;

  try {
    let hire = await Hire.findById(id);
    if (!hire) return res.status(404).json({ msg: 'Contratación no encontrada' });

    // Solo el trabajador puede aceptar/rechazar
    if (hire.worker.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    hire.status = status;
    await hire.save();

    res.json({ msg: 'Estado actualizado', hire });
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
};

exports.markAsCompleted = async (req, res) => {
  try {
    const hire = await Hire.findById(req.params.id).populate('worker');
    if (!hire) return res.status(404).json({ msg: "Contratación no encontrada" });

    if (hire.worker._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: "No autorizado" });
    }

    if (hire.status !== 'aceptado') {
      return res.status(400).json({ msg: "Solo se puede completar un trabajo aceptado" });
    }

    hire.status = 'completado';
    hire.completedAt = new Date();
    await hire.save();

    res.json({ msg: "Trabajo marcado como completado", hire });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
};
