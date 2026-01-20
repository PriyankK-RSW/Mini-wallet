const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const {addRewardPoints }= require("../controllers/rewardController")

function generateTransactionRef() {
  return `TXN${Date.now()}`;
}

const PLAN_PRICES = {
  CANTEEN_MONTHLY: 1000,
};

const PLAN_DURATION_DAYS = 30;
exports.subscribeUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { plan, pin } = req.body;
    const user = req.user;

    if(plan != CANTEEN_MONTHLY){
        return res.status(400).json({message : "Enter Valid Plan"})
    }


    if (!plan || !pin) {
      return res.status(400).json({ message: "Plan and PIN are required" });
    }

    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    const pinValid = await bcrypt.compare(pin, user.pinHash);
    if (!pinValid) {
      return res.status(401).json({ message: "Invalid transaction PIN" });
    }

    const now = new Date();
    if (
      user.subscription &&
      user.subscription.plan === plan &&
      new Date(user.subscription.endDate) > now
    ) {
      return res
        .status(400)
        .json({ message: "You already have an active subscription for this plan" });
    }

    const wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) throw new Error("Wallet not found");

    const price = PLAN_PRICES[plan];
    if (wallet.balance < price) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    session.startTransaction();

    wallet.balance -= price;
    await wallet.save({ session });

    await Transaction.create(
      [
        {
          userId: user._id,
          walletId: wallet.walletId,
          counterpartyWalletId: "SUBSCRIPTION",
          amount: price,
          type: "DEBIT",
          balanceAfter: wallet.balance,
          reference: generateTransactionRef(),
        },
      ],
      { session }
    );

    const startDate = now;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + PLAN_DURATION_DAYS);

    user.subscription = {
      plan,
      startDate,
      endDate,
      benefitsUsed: {
        meals: 0,
        events: 0,
        books: 0,
      },
    };

    await user.save({ session });

    await session.commitTransaction();
    await addRewardPoints(user._id, price);

    res.status(200).json({
      message: `Subscribed to ${plan} successfully`,
      subscription: user.subscription,
      walletBalance: wallet.balance,
    });
  } catch (err) {
    console.error("Subscription error:", err.message);
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      console.error("Abort transaction error:", abortErr.message);
    }
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
};
