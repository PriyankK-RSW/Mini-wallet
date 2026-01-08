// routes/stripeRoute.js (renamed for clarity, but you can keep as striperoute.js)
const express = require("express");
const router = express.Router();
const { createPaymentIntent, withdrawMoney } = require("../controllers/stripeController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add-money", authMiddleware, createPaymentIntent);
router.post("/withdraw", authMiddleware, withdrawMoney);

module.exports = router;