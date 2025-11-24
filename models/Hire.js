const { Schema, model } = require('mongoose');

const hireSchema = new Schema({
  worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['pendiente', 'aceptado', 'rechazado', 'completado'],
    default: 'pendiente'
  },
  date: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    reviewedAt: { type: Date }
  }
}, {
  timestamps: true
});

module.exports = model('Hire', hireSchema);
