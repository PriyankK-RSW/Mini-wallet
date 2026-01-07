const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { transferMoney , getMyWallet ,getTransactions } = require("../controllers/walletController");

const router = express.Router();

router.post("/transfer", authMiddleware, transferMoney);
router.get("/me" , authMiddleware , getMyWallet );
router.get("/transactions" , authMiddleware , getTransactions)
module.exports = router;
