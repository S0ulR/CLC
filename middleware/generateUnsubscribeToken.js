// backend/utils/generateUnsubscribeToken.js
const crypto = require("crypto");

const generateUnsubscribeToken = (userId) => {
  const payload = `${userId}.${Date.now()}`;
  const hmac = crypto.createHmac("sha256", process.env.JWT_SECRET || "secret-key");
  const signature = hmac.update(payload).digest("hex");
  return `${payload}.${signature}`;
};

module.exports = generateUnsubscribeToken;
