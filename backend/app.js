const express = require("express");
const authRoutes = require("./routes/authRoute.js");
const walletRoutes = require("./routes/walletRoute.js");
const app = express();
const cors = require("cors");
const stripeRoute = require("./routes/stripeRoute.js");
const webhookRoutes = require("./routes/webhookRoute.js");
const addTransactionRoute = require("./routes/addTransactionRoute");
const healthRoutes = require("./routes/healthcheckRoute.js");

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use("/stripe", webhookRoutes);

app.use(express.json({ strict: false }));
app.use("/", addTransactionRoute);
app.use("/stripe", stripeRoute); 
app.use("/auth", authRoutes);
app.use("/wallet", walletRoutes);
app.use("/health", healthRoutes);
app.use("/services", require("./routes/serviceRoute.js"));
app.use("/library", require("./routes/librartRoute.js"));
app.use("/canteen", require("./routes/canteenRoute.js"));
app.use("/events", require("./routes/eventRoute.js"));

module.exports = app;