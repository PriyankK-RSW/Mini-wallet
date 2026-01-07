const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    walletId: {
      type: String, // BUSINESS ID (UPI-like)
      required: true,
      index: true
    },

    counterpartyWalletId: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

    type: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      required: true
    },

    balanceAfter: {
      type: Number,
      required: true
    },

    reference: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
