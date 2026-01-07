// models/Wallet.js
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 1000, required: true },
  walletId: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);
