// backend/routes/invoiceRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { sendInvoiceEmail } = require("../controllers/invoiceController");

router.post("/send", auth, sendInvoiceEmail);

module.exports = router;
