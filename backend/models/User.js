// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  pinHash: { type: String, required: true },
  walletId: { type: String, unique: true, required: true },
  rewardsPoints: { type: Number, default: 0 },
  subscription: {
  plan: { type: String },          // e.g., "CANTEEN_MONTHLY"
  startDate: { type: Date },
  endDate: { type: Date },
  benefitsUsed: {
    meals: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    books: { type: Number, default: 0 }
  }
}

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
