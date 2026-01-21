const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const redis = require("../config/redis");

const User = require("../models/User");
const { addRewardPoints } = require("./rewardController");

function generateTransactionRef() {
  return `TXN${Date.now()}`;
}

const transferMoney = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { receiverWalletId, amount, pin, idempotencyKey } = req.body;
    const sender = req.user;

    if (!receiverWalletId || !amount || !pin || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }


    
    const pinValid = await bcrypt.compare(pin, sender.pinHash);
    if (!pinValid) {
      return res.status(401).json({ message: "Invalid transaction PIN" });
    }

    const redisKey = `txn:${idempotencyKey}`;
    const lock = await redis.set(redisKey, "processing", "NX", "EX", 60);
    if (!lock) {
      return res.status(409).json({ message: "Duplicate transaction request" });
    }

    session.startTransaction();

     const senderWallet = await Wallet.findOneAndUpdate(
      {
        userId: sender._id,
        balance: { $gte: amount } 
      },
      { $inc: { balance: -amount } },
      { new: true, session }
    );

    if (!senderWallet) {
      throw new Error("Insufficient balance");
    }

    const receiverWallet = await Wallet.findOneAndUpdate(
      { walletId: receiverWalletId },
      { $inc: { balance: amount } },
      { new: true, session }
    );

    if (!receiverWallet) {
      throw new Error("Receiver wallet not found");
    }

    const txnRef = generateTransactionRef();
try {
    await Transaction.insertMany(
      [
        {
          userId: sender._id,
          walletId: senderWallet.walletId,
          counterpartyWalletId: receiverWallet.walletId,
          amount,
          type: "DEBIT",
          balanceAfter: senderWallet.balance,
          reference: txnRef
        },
        {
          userId: receiverWallet.userId,
          walletId: receiverWallet.walletId,
          counterpartyWalletId: senderWallet.walletId,
          amount,
          type: "CREDIT",
          balanceAfter: receiverWallet.balance,
          reference: txnRef
        }
      ],
      { session, ordered: true }
    );} catch (err) {
    if (err.code === 11000) {
      throw new Error("Duplicate transaction reference");
    }
  }
    await session.commitTransaction();

    await redis.set(redisKey, "completed", "EX", 300);
    await addRewardPoints(sender._id, amount);
    res.status(200).json({
      message: "Transfer successful",
      reference: txnRef
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Transfer failed:", err.message);

    res.status(500).json({
      error: err.message
    });
  } finally {
    session.endSession();
  }
};


const getMyWallet = async (req, res) => {
  try {
    const userIdFromToken = req.user?._id || req.userId;

    if (!userIdFromToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const wallet = await Wallet.findOne({ userId: userIdFromToken });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const user = await User.findById(userIdFromToken).select(
      "email rewardPoints subscription"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      userId: user._id,
      walletId: wallet.walletId,
      email: user.email,
      balance: wallet.balance,
      rewardPoints: user.rewardPoints || 0,
      subscription: user.subscription || null,
    });

  } catch (err) {
    console.error("Get wallet failed:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;

    
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      page,
      limit,
      count: transactions.length,
      transactions
    });
  } catch (err) {
    console.error("Get transactions failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



module.exports = { transferMoney , getMyWallet , getTransactions};
