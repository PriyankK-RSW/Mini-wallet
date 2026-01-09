const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { transferMoney , getMyWallet ,getTransactions } = require("../controllers/walletController");
const rateLimiter = require("../middleware/rateLimiter");
const router = express.Router();


const limmeter  = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  blockDurationMs: 60 * 60 * 1000,
  message: "Too many attempts. Please try again later.",
});


router.post("/transfer", authMiddleware, limmeter , transferMoney);
router.get("/me" , authMiddleware , getMyWallet );
router.get("/transactions" , authMiddleware , getTransactions)
module.exports = router;
