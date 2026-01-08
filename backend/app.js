// app.js
const express = require("express");
const authRoutes = require("./routes/authRoute.js");
const walletRoutes = require("./routes/walletRoute.js");
const app = express();
const cors = require("cors");
const stripeRoute = require("./routes/stripeRoute.js"); // Adjusted name if changed
const webhookRoutes = require("./routes/webhookRoute.js");
const addTransactionRoute = require("./routes/addTransactionRoute");
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Mount webhook before body parser to ensure raw body
app.use("/stripe", webhookRoutes);

// Now the JSON parser for other routes
app.use(express.json({ strict: false }));
app.use("/", addTransactionRoute);
// Mount other routes
app.use("/stripe", stripeRoute); // Now /stripe/add-money, /stripe/withdraw to avoid root conflicts
app.use("/auth", authRoutes);
app.use("/wallet", walletRoutes);

module.exports = app;