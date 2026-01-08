// controllers/stripeController.js
const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { generateTransactionRef } = require("../utils/generateTransactionRef");
const stripe = require("../config/stripe");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (!user || !user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert INR to paise
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user._id.toString(),
      },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("PaymentIntent creation error:", err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("Webhook received:", event.type);

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    console.log("Payment succeeded:", intent.id);

    const userId = intent.metadata.userId;
    const amount = intent.amount / 100; // Convert paise back to INR

    if (!userId || !amount) {
      console.error("Missing userId or amount in metadata");
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const wallet = await Wallet.findOne({ userId }).session(session);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      wallet.balance += amount;
      await wallet.save({ session });

      const reference = generateTransactionRef();
      await Transaction.create(
        [
          {
            userId,
            walletId: wallet.walletId,
            counterpartyWalletId: "STRIPE",
            amount,
            type: "CREDIT",
            balanceAfter: wallet.balance,
            reference,
            stripeIntentId: intent.id, // To prevent duplicates if webhook retries
          },
        ],
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error("Webhook processing error:", err.message);
      // Still return 200 to Stripe, but log error
    } finally {
      session.endSession();
    }
  }

  // Always acknowledge receipt to Stripe
  res.status(200).json({ received: true });
};

exports.withdrawMoney = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }
    wallet.balance -= amount;
    await wallet.save({ session });
    const reference = generateTransactionRef();
    await Transaction.create(
      [
        {
          userId,
          walletId: wallet.walletId,
          counterpartyWalletId: "BANK",
          amount,
          type: "WITHDRAW",
          balanceAfter: wallet.balance,
          reference,
        },
      ],
      { session }
    );
    await session.commitTransaction();
    res.json({ message: "Withdrawal successful", reference });
  } catch (err) {
    await session.abortTransaction();
    console.error("Withdrawal error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
};