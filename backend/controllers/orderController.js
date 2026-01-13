const Order = require("../models/Oders");
const Wallet = require("../models/Wallet");
const bcrypt = require("bcrypt");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { genTransactionReference } = require("../utils/generateTransactionRef");
const mongoose = require("mongoose");
const crypto = require("crypto");


exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    const {
      service,
      itemId,
      itemName,
      itemPrice,
      quantity = 1,
      address,
      pin
    } = req.body;

    if (!service || !itemId || !itemName || !itemPrice || !pin) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user || !user.pinHash) {
      return res.status(404).json({ message: "User or PIN not found" });
    }

    const pinValid = await bcrypt.compare(pin, user.pinHash);
    if (!pinValid) {
      return res.status(401).json({ message: "Invalid transaction PIN" });
    }

    const totalAmount = itemPrice * quantity;

    const wallet = await Wallet.findOneAndUpdate(
      {
        userId,
        balance: { $gte: totalAmount }
      },
      {
        $inc: { balance: -totalAmount }
      },
      {
        new: true,
        session
      }
    );

    if (!wallet) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const transaction = await Transaction.create(
      [{
        userId,
        walletId: wallet._id,
        counterpartyWalletId: "SYSTEM",
        amount: totalAmount,
        type: "DEBIT",
        balanceAfter: wallet.balance,
        reference: crypto.randomUUID(),
        service
      }],
      { session }
    );

    const order = await Order.create(
      [{
        userId,
        service,
        itemId,
        itemName,
        itemPrice,
        quantity,
        totalAmount,
        transactionId: transaction[0]._id,
        address
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Order placed successfully",
      order: order[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
};
