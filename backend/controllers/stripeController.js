const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const stripe = require("../config/stripe");
function generateTransactionRef() {
  return `TXN${Date.now()}`;
}

const validateAmount = (amount) => {
  return amount && typeof amount === "number" && amount > 0;
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;
    if (!validateAmount(amount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (!user || !user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
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
  

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).send("Webhook secret not configured");
  } 
  if (!req.headers["stripe-signature"]) {
    console.error("Missing Stripe signature header");
    return res.status(400).send("Missing Stripe signature");
  }
  if (!req.body) {
    console.error("Missing request body");
    return res.status(400).send("Missing request body");
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    const intent = event.data.object;

    const existingTransaction = await Transaction.findOne({
      stripeIntentId: intent.id,
    });
    if (existingTransaction) {
      console.log("Payment already processed.");
      return res.status(200).json({ received: true });
    }

    
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("Webhook received:", event.type);

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    console.log("Payment succeeded");

    const userId = intent.metadata.userId;
    const amount = intent.amount / 100; 

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
            stripeIntentId: intent.id,
          },
        ],
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error("Webhook processing error:", err.message);
     } finally {
      session.endSession();
    }
  }
  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    console.log("Payment failed:", intent.last_payment_error?.message);
  }
  if (event.type === "payment_intent.canceled") {
    const intent = event.data.object;
    console.log("Payment canceled for intent");
  } 
  res.status(200).json({ received: true });
};
