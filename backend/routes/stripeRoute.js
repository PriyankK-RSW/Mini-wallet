// routes/stripeRoute.js (renamed for clarity, but you can keep as striperoute.js)
const express = require("express");
const router = express.Router();
const { createPaymentIntent  } = require("../controllers/stripeController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add-money", authMiddleware, createPaymentIntent);

module.exports = router;

