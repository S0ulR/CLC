// C:\Users\Leandro\Desktop\CLC\config\firebase.js
const admin = require("firebase-admin");

// ✅ Cargar credenciales desde variables de entorno individuales
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// ✅ Reemplazar \n solo si private_key existe
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} else {
  console.error(
    "❌ Error: La variable de entorno PRIVATE_KEY no está definida."
  );
  process.exit(1);
}

// ✅ Validar que las variables críticas estén presentes
const requiredFields = ["project_id", "private_key", "client_email"];
const missingFields = requiredFields.filter((field) => !serviceAccount[field]);

if (missingFields.length > 0) {
  console.error(
    `❌ Error: Faltan variables de entorno de Firebase: ${missingFields.join(
      ", "
    )}`
  );
  console.error(
    "💡 Asegúrate de que tu archivo .env tenga todas las variables necesarias."
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log(
  "✅ Firebase inicializado correctamente desde variables de entorno."
);

module.exports = admin;
