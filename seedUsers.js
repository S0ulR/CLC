const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// Conectar a MongoDB
mongoose
  .connect(
    "mongodb+srv://BilcapujioRuiz:bilcapujio22clc@cluster0.u28ztua.mongodb.net/Bilca?retryWrites=true&w=majority"
  )
  .then(() => console.log("✅ Conectado a MongoDB para seed"))
  .catch((err) => {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    process.exit(1);
  });

// Coordenadas de San Lorenzo, Santa Fe, Argentina
const SAN_LORENZO = {
  lat: -32.6333,
  lng: -60.95,
};

// Generar coordenadas cercanas (~20 km)
const generateNearbyCoords = (center, maxKm = 20) => {
  const randomDistance = maxKm * Math.sqrt(Math.random());
  const randomAngle = Math.random() * 2 * Math.PI;
  const dx = (randomDistance * Math.cos(randomAngle)) / 111;
  const dy = (randomDistance * Math.sin(randomAngle)) / 111;
  return [center.lng + dx, center.lat + dy];
};

// Generar coordenadas lejanas
const generateDistantCoords = () => {
  const cities = [
    { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
    { lat: -31.4201, lng: -64.1888 }, // Córdoba
    { lat: -32.8895, lng: -68.8458 }, // Mendoza
    { lat: -38.7362, lng: -62.2539 }, // Bahía Blanca
    { lat: -24.7917, lng: -65.4127 }, // Salta
    { lat: -38.0019, lng: -57.5595 }, // Mar del Plata
  ];
  const city = cities[Math.floor(Math.random() * cities.length)];
  return [city.lng, city.lat];
};

// Generar avatar dinámico
const generateAvatarUrl = (name) => {
  const seed = encodeURIComponent(name.trim().replace(/\s+/g, ""));
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// Generar fecha de nacimiento aleatoria (entre 18 y 65 años atrás)
const generateRandomBirthday = () => {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 65);
  const end = new Date();
  end.setFullYear(end.getFullYear() - 18);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Generar teléfono aleatorio con prefijos reales de Argentina
const generateRandomPhone = () => {
  const prefixes = ["11", "341", "351", "261", "299", "223"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000); // 8 dígitos
  return `${prefix}${number}`;
};

// Profesiones válidas
const professionsList = [
  "plomero",
  "electricista",
  "niñero",
  "albañil",
  "jardinero",
  "carpintero",
  "pintor",
  "limpieza",
  "paseador de perros",
  "cuidadores de adultos",
  "mudanzas",
  "gasista",
];

const users = [];

// Admin
users.push({
  name: "Admin Bilca",
  email: "admin@bilca.com",
  password: "123456",
  role: "admin",
  photo: generateAvatarUrl("AdminBilca"),
  location: {
    coordinates: [SAN_LORENZO.lng, SAN_LORENZO.lat],
    address: "San Lorenzo, Santa Fe",
  },
  birthday: generateRandomBirthday(),
  country: "Argentina",
  phone: generateRandomPhone(),
  city: "San Lorenzo",
  profileCompleted: true,
  services: [], // Admin no ofrece servicios
});

// 14 usuarios (clientes)
for (let i = 1; i <= 14; i++) {
  const isNearby = Math.random() > 0.3;
  const coords = isNearby
    ? generateNearbyCoords(SAN_LORENZO, 15)
    : generateDistantCoords();

  const city = isNearby ? "San Lorenzo" : "Otra ciudad";

  users.push({
    name: `Usuario ${i}`,
    email: `user${i}@test.com`,
    password: "123456",
    role: "user",
    photo: generateAvatarUrl(`Usuario${i}`),
    location: {
      coordinates: [coords[0], coords[1]],
      address: isNearby ? "San Lorenzo, Santa Fe" : "Otra ciudad, Argentina",
    },
    birthday: generateRandomBirthday(),
    country: "Argentina",
    phone: generateRandomPhone(),
    city: city,
    profileCompleted: true,
    services: [],
  });
}

// 50 trabajadores
for (let i = 1; i <= 50; i++) {
  const isNearby = i <= 35;
  const coords = isNearby
    ? generateNearbyCoords(SAN_LORENZO, 20)
    : generateDistantCoords();

  const city = isNearby ? "San Lorenzo" : "Otra ciudad";

  // Seleccionar entre 1 y 3 profesiones aleatorias
  const shuffled = professionsList.sort(() => 0.5 - Math.random());
  const selectedProfessions = shuffled.slice(
    0,
    Math.floor(Math.random() * 3) + 1
  );

  // Crear servicios con tarifa y bio por oficio
  const services = selectedProfessions.map(profession => {
    const hourlyRate = Math.floor(Math.random() * 20) + 20; // $20-40/h
    return {
      profession,
      hourlyRate,
      bio: `Soy experto en ${profession}. Trabajo con herramientas profesionales, garantía y puntualidad.`,
      isActive: true,
    };
  });

  const totalJobs = Math.floor(Math.random() * 50);
  const rating = Number((Math.random() * 2 + 3).toFixed(1)); // 3.0 a 5.0

  users.push({
    name: `Trabajador ${i}`,
    email: `worker${i}@test.com`,
    password: "123456",
    role: "worker",
    photo: generateAvatarUrl(`Trabajador${i}`),
    bio: `Técnico especializado en múltiples áreas. Comprometido con la calidad y el cliente satisfecho.`,
    totalJobs,
    rating,
    location: {
      coordinates: [coords[0], coords[1]],
      address: isNearby ? "San Lorenzo, Santa Fe" : "Otra ciudad, Argentina",
    },
    birthday: generateRandomBirthday(),
    country: "Argentina",
    phone: generateRandomPhone(),
    city: city,
    profileCompleted: true,
    services, // ✅ Servicios con detalles por oficio
  });
}

// Seed function
const seed = async () => {
  try {
    await User.deleteMany({});
    console.log("🗑️  Colección User limpiada");

    const usersWithHash = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        return new User(user);
      })
    );

    await User.insertMany(usersWithHash);
    console.log(`✅ ${usersWithHash.length} usuarios insertados con éxito`);

    console.log("\n" + "=".repeat(50));
    console.log("🔐 CREDENCIALES DE ACCESO");
    console.log("=".repeat(50));

    const admin = users.find((u) => u.role === "admin");
    console.log(`\n📌 Admin:\n   Email: ${admin.email}\n   Contraseña: 123456`);

    console.log(`\n📌 Users (clientes):`);
    users
      .filter((u) => u.role === "user")
      .slice(0, 14)
      .forEach((u) => {
        console.log(`   ${u.name}: ${u.email} / 123456`);
      });

    console.log(`\n📌 Workers (5 ejemplos):`);
    users
      .filter((u) => u.role === "worker")
      .slice(0, 5)
      .forEach((u) => {
        console.log(
          `   ${u.name} (${u.services.map(s => s.profession).join(", ")}): ${u.email} / 123456`
        );
      });

    console.log(
      "\n💡 Usa estas credenciales para probar login y búsqueda por cercanía.\n"
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Error al insertar:", err.message);
    process.exit(1);
  }
};

mongoose.connection.once("open", () => {
  console.log("🟢 Conexión a MongoDB establecida, comenzando seed...");
  seed();
});
