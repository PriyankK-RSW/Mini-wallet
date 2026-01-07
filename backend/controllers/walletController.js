const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const redis = require("../config/redis");
const { generateTransactionRef } = require("../utils/generateTransactionRef");
const User = require("../models/User")
const transferMoney = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { receiverWalletId, amount, pin, idempotencyKey } = req.body;
    const sender = req.user;

    if (!receiverWalletId || !amount || !pin || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const pinValid = await bcrypt.compare(pin, sender.pinHash);
    if (!pinValid) {
      return res.status(401).json({ message: "Invalid transaction PIN" });
    }

    const redisKey = `txn:${idempotencyKey}`;
    const lock = await redis.set(redisKey, "processing", "NX", "EX", 50);
    if (!lock) {
      return res.status(409).json({ message: "Duplicate transaction request" });
    }

    session.startTransaction();

    //  Load wallets
    const senderWallet = await Wallet.findOne(
      { userId: sender._id },
      null,
      { session }
    );

    if (!senderWallet) throw new Error("Sender wallet not found");

    const receiverWallet = await Wallet.findOne(
      { walletId: receiverWalletId },
      null,
      { session }
    );

    if (!receiverWallet) throw new Error("Receiver wallet not found");

    // Get LAST ledger entries (source of truth)
    const [lastSenderTxn] = await Transaction.find(
      { walletId: senderWallet.walletId }
    )
      .sort({ createdAt: -1 })
      .limit(1)
      .session(session);

    const [lastReceiverTxn] = await Transaction.find(
      { walletId: receiverWallet.walletId }
    )
      .sort({ createdAt: -1 })
      .limit(1)
      .session(session);

    const senderPrevBalance =
      lastSenderTxn?.balanceAfter ?? senderWallet.balance;

    if (senderPrevBalance < amount) {
      throw new Error("Insufficient balance");
    }

    const receiverPrevBalance =
      lastReceiverTxn?.balanceAfter ?? receiverWallet.balance;

    const senderBalanceAfter = senderPrevBalance - amount;
    const receiverBalanceAfter = receiverPrevBalance + amount;

    senderWallet.balance = senderBalanceAfter;
    receiverWallet.balance = receiverBalanceAfter;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });

    const txnRef = generateTransactionRef();

    await Transaction.insertMany(
      [
        {
          userId: sender._id,
          walletId: senderWallet.walletId,
          counterpartyWalletId: receiverWallet.walletId,
          amount,
          type: "DEBIT",
          balanceAfter: senderBalanceAfter,
          reference: txnRef
        },
        {
          userId: receiverWallet.userId,
          walletId: receiverWallet.walletId,
          counterpartyWalletId: senderWallet.walletId,
          amount,
          type: "CREDIT",
          balanceAfter: receiverBalanceAfter,
          reference: txnRef
        }
      ],
      { session, ordered: true }
    );

    await session.commitTransaction();
    await redis.set(redisKey, "completed", "EX", 300);

    res.status(200).json({
      message: "Transfer successful",
      reference: txnRef
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Transfer failed:", err.message);
    res.status(500).json({ error: err.message });
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

    const user = await User.findById(
      new mongoose.Types.ObjectId(wallet.userId)
    ).select("email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      userId: wallet.userId,
      walletId: wallet.walletId,
      email: user.email,
      balance: wallet.balance
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
