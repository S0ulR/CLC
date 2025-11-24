// backend/routes/documentRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const upload = require("../middleware/multer");
const { sendDocumentEmail } = require("../controllers/documentController");

router.post("/send-email", auth, upload.single("attachment"), sendDocumentEmail);

module.exports = router;
