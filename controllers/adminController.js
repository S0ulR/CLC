const User = require('../models/User');
const Hire = require('../models/Hire');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, isVerified } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    if (role) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const totalHires = await Hire.countDocuments();
    const pendingHires = await Hire.countDocuments({ status: 'pendiente' });

    res.json({ totalUsers, totalWorkers, totalHires, pendingHires });
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
};
