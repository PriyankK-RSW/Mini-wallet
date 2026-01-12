const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: String, required: true }, // LIBRARY, EVENTS, etc.
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemPrice: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    additionalDetails: { type: Object },
    status: { type: String, default: "COMPLETED" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
