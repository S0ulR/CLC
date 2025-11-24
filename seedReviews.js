// seedReviews.js
const mongoose = require('mongoose');
const Review = require('./models/Review');
const User = require('./models/User');
const Notification = require('./models/Notification');

// Conexión a MongoDB
mongoose.connect('mongodb+srv://BilcapujioRuiz:bilcapujio22clc@cluster0.u28ztua.mongodb.net/Bilca?retryWrites=true&w=majority')
  .then(() => console.log('✅ Conectado a MongoDB para seed'))
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

const seedReviews = async () => {
  try {
    // 1. Eliminar datos existentes
    await Review.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑️ Reseñas y notificaciones eliminadas');

    // 2. Obtener usuarios
    const workers = await User.find({ role: 'worker' }).select('_id');
    const clients = await User.find({ role: 'user' }).select('_id name');

    if (workers.length === 0 || clients.length === 0) {
      console.warn('⚠️ No hay trabajadores o clientes en la base de datos. Terminando seed.');
      mongoose.disconnect();
      return;
    }

    console.log(`🎯 Encontrados: ${workers.length} trabajadores, ${clients.length} clientes`);

    // 3. Generar reseñas y notificaciones
    const reviews = [];
    const notifications = [];

    const commentOptions = [
      'Excelente trabajo, muy profesional.',
      'Cumplió con el plazo y el presupuesto.',
      'Buena comunicación y resultado impecable.',
      'Recomiendo ampliamente sus servicios.',
      'Trabajo de calidad y atención al detalle.',
      'Muy responsable y puntual.',
      'Gran experiencia, volvería a contratarlo.',
      'Precios justos y buen trato.',
      'Resolvió todo rápido y eficiente.',
      'Trabajo impecable, muy satisfecho.'
    ];

    const now = new Date();

    for (const worker of workers) {
      const numReviews = Math.floor(Math.random() * 5) + 1; // 1-5 reseñas

      for (let i = 0; i < numReviews; i++) {
        const client = clients[Math.floor(Math.random() * clients.length)];
        const rating = [4, 5, 5, 4, 5, 5, 4, 5][Math.floor(Math.random() * 8)]; // Mayor peso a 4 y 5

        // Fecha aleatoria en los últimos 90 días
        const daysAgo = Math.floor(Math.random() * 90);
        const createdAt = new Date(now);
        createdAt.setDate(now.getDate() - daysAgo);

        const review = new Review({
          worker: worker._id,
          user: client._id,
          rating,
          comment: commentOptions[Math.floor(Math.random() * commentOptions.length)],
          createdAt
        });

        reviews.push(review);

        // Crear notificación para el trabajador
        notifications.push({
          user: worker._id,
          message: `${client.name} te dejó una reseña: "${review.comment.substring(0, 30)}..."`,
          type: 'review',
          relatedId: review._id,
          onModel: 'Review',
          createdAt,
          read: Math.random() > 0.3 // 70% no leídas
        });
      }
    }

    // 4. Insertar reseñas
    const savedReviews = await Review.insertMany(reviews, { ordered: false });
    console.log(`✅ ${savedReviews.length} reseñas insertadas`);

    // 5. Insertar notificaciones
    await Notification.insertMany(notifications, { ordered: false });
    console.log(`✅ ${notifications.length} notificaciones insertadas`);

    // 6. Actualizar trabajadores con nuevo rating, totalJobs y reviews
    for (const worker of workers) {
      const workerReviews = savedReviews.filter(r => r.worker.toString() === worker._id.toString());
      const totalRating = workerReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = workerReviews.length > 0 ? totalRating / workerReviews.length : 0;

      worker.rating = parseFloat(avgRating.toFixed(1));
      worker.totalJobs = workerReviews.length;
      worker.reviews = workerReviews.map(r => r._id);

      await worker.save();
    }

    console.log('✅ Todos los trabajadores actualizados con rating, totalJobs y reseñas');

    // 7. Desconectar
    await mongoose.disconnect();
    console.log('🔌 Base de datos de seed finalizada y desconectada');
  } catch (err) {
    console.error('❌ Error en el proceso de seed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

mongoose.connection.once('open', seedReviews);