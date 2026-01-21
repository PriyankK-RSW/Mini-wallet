const Order = require("../models/Oders");
const Wallet = require("../models/Wallet");
const bcrypt = require("bcrypt");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { genTransactionReference } = require("../utils/generateTransactionRef");
const mongoose = require("mongoose");
const crypto = require("crypto");
const {addRewardPoints }= require("../controllers/rewardController")

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
      pin,
      benefitType
    } = req.body;
 

    if (!service || !itemId || !itemName || !itemPrice || !pin ) {
      return res.status(400).json({ message: "Missing required fields" });
    }


    const user = await User.findById(userId).session(session);
    if (!user || !user.pinHash) {
      return res.status(404).json({ message: "User or PIN not found" });
    }

    const pinValid = await bcrypt.compare(pin, user.pinHash);
    if (!pinValid) {
      return res.status(401).json({ message: "Invalid transaction PIN" });
    }

    
    
    
    let totalAmount = itemPrice * quantity;
    let freeFromSubscription = false;

    if (
      user.subscription &&
      user.subscription.benefitsUsed[benefitType] < getPlanLimit(user.subscription.plan, benefitType)
    ) {
      totalAmount = 0; // free
      freeFromSubscription = true;

      user.subscription.benefitsUsed[benefitType] =
        (user.subscription.benefitsUsed[benefitType] || 0) + quantity;

      await user.save({ session });
    }

    let wallet = null;
    if (totalAmount >= 0) {
      wallet = await Wallet.findOneAndUpdate(
        { userId, balance: { $gte: totalAmount } },
        { $inc: { balance: -totalAmount } },
        { new: true, session }
      );

      if (!wallet) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
    } else {
      wallet = await Wallet.findOne({ userId }).session(session);
    }

    const transaction = await Transaction.create(
      [
        {
          userId,
          walletId: wallet._id,
          counterpartyWalletId: freeFromSubscription ? "SUBSCRIPTION" : "SYSTEM",
          amount: totalAmount,
          type: "DEBIT",
          balanceAfter: wallet.balance,
          reference: crypto.randomUUID(),
          service,
        },
      ],
      { session }
    );

    const order = await Order.create(
      [
        {
          userId,
          service,
          itemId,
          itemName,
          itemPrice,
          quantity,
          totalAmount,
          transactionId: transaction[0]._id,
          address,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    if (!freeFromSubscription) {
      await addRewardPoints(userId, totalAmount);
    }

    res.status(201).json({
      message: freeFromSubscription
        ? `Order placed using subscription benefit`
        : "Order placed successfully",
      order: order[0],
      walletBalance: wallet.balance,
      subscriptionUsed: freeFromSubscription,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};


function getPlanLimit(plan, type) {
  const limits = {
    CANTEEN_MONTHLY: { meals: 9},
  };
  return limits[plan][type] ||   0;
}

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

exports.getorderByservice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { service } = req.params;

    const orders = await Order.find({ userId, service })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders by service",
      error: error.message
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching order by ID",
      error: error.message
    });
  }
}
exports.getAdminDashboard = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const serviceStats = {};

    orders.forEach((order) => {
      if (!serviceStats[order.service]) {
        serviceStats[order.service] = {
          totalOrders: 0,
          revenue: 0,
        };
      }

      serviceStats[order.service].totalOrders += 1;
      serviceStats[order.service].revenue += order.totalAmount;
    });

    res.status(200).json({
      totalOrders: orders.length,
      totalRevenue,
      serviceStats,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching admin dashboard",
      error: error.message,
    });
  }
};
exports.getServiceDashboard = async (req, res) => {
  try {
   
    const service = req.user.email.split("@")[0].toUpperCase();
    const orders = await Order.find({ service })
      .sort({ createdAt: -1 });

    res.status(200).json({
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching service dashboard",
      error: error.message,
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching your orders",
      error: error.message
    });
  }
};