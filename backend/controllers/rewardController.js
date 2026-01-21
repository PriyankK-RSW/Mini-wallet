const mongoose = require("mongoose");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

async function getRewardsPoints(req, res)   {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("rewardsPoints");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ rewardsPoints: user.rewardsPoints });
  } catch (error) {
    console.error("Error fetching rewards points:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

 async function giftPoints (req, res)  {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user._id;
    const { receiverWalletId, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const sender = await User.findById(senderId).session(session);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    if (sender.rewardsPoints < amount) {
      return res.status(400).json({ message: "Insufficient reward points" });
    }

    const receiverWallet = await Wallet.findOne({
      walletId: receiverWalletId,
    }).session(session);

    if (!receiverWallet)
      return res.status(404).json({ message: "Receiver wallet not found" });

    const receiver = await User.findById(receiverWallet.userId).session(session);
    if (!receiver)
      return res.status(404).json({ message: "Receiver not found" });

    sender.rewardsPoints -= amount;
    receiver.rewardsPoints = (receiver.rewardsPoints || 0) + amount;

    await sender.save({ session });
    await receiver.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      message: "Reward points gifted successfully",
      giftedPoints: amount,
      to: receiver.email,
      remainingPoints: sender.rewardsPoints,
    });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Failed to gift reward points",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

async function addRewardPoints(userId, amount) {

    const points = Math.floor(amount / 100);

  if (points > 0) {
    await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardsPoints: points } },
      { new: true }
    );
    console.log(`Added ${points} reward points to user ${userId}`);
  }
}

async function redeemRewardPoints(req, res) {
  const session = await mongoose.startSession();

  try {
    const { pointsToRedeem } = req.body;
    const userId = req.user._id;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({ message: "" });
    }

    session.startTransaction();


    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    if (user.rewardsPoints < pointsToRedeem) {
      throw new Error("Insufficient reward points");
    }

    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new Error("Wallet not found");


    user.rewardsPoints -= pointsToRedeem;
    await user.save({ session });


    wallet.balance += pointsToRedeem;
    await wallet.save({ session });


    const txnRef = `TXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    await Transaction.create(
      [
        {
          userId,
          walletId: wallet.walletId,
          amount: pointsToRedeem,
          type: "CREDIT",
          counterpartyWalletId: "SYSTEM",
          reference: txnRef,
          balanceAfter: wallet.balance,
          description: "Reward points redeemed",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      message: "Reward points redeemed successfully",
      redeemedPoints: pointsToRedeem,
      newBalance: wallet.balance,
      remainingPoints: user.rewardsPoints,
      reference: txnRef,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Reward redemption failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};  
module.exports = { addRewardPoints  , getRewardsPoints ,redeemRewardPoints ,giftPoints};