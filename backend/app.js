const express = require("express");
const authRoutes = require("./routes/authRoute.js");
const walletRoutes = require("./routes/walletRoute.js")
const app = express();
const cors = require('cors');

app.use(cors());  
app.use(express.json({ strict: false }));

app.use("/auth", authRoutes);
app.use("/wallet" , walletRoutes )
module.exports = app;
