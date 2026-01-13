const Order = require("../models/Oders");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { genTransactionReference } = require("../utils/generateTransactionRef");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      service,         
      itemId,
      itemName,
      itemPrice,
      quantity = 1,
      address 
    } = req.body;

    if (!service || !itemId || !itemName || !itemPrice) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const totalAmount = itemPrice * quantity;

    if (wallet.balance < totalAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    console.log("Total Amount to be deducted:", totalAmount);
    console.log("Wallet Balance before deduction:", wallet.balance);

    wallet.balance -= totalAmount;
    await wallet.save();
    console.log("Wallet Balance after deduction:", wallet.balance);

    
    const transaction = await Transaction.create({
      userId,
      walletId: wallet._id,
      counterpartyWalletId: "SYSTEM",
      amount: totalAmount,
      type: "DEBIT",
      balanceAfter: wallet.balance,
      reference: Math.random().toString(36).substring(2, 15),
      service
    });

   
    const order = await Order.create({
      userId,
      service,
      itemId,
      itemName,
      itemPrice,
      quantity,
      totalAmount,
      transactionId: transaction._id,
      address
    });

    res.status(201).json({
      message: "Order placed successfully",
      order
    });

  } catch (error) {
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
