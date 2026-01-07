// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  pinHash: { type: String, required: true },
  walletId: { type: String, unique: true, required: true }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
