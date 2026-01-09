const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const { generateWalletId } = require("../utils/generateWalletId");
require("dotenv").config();

const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

const register = async (req, res) => {
  try {
    const { email, password, pin } = req.body;

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const pinHash = await bcrypt.hash(pin, saltRounds);
    const walletId = generateWalletId();

    const user = await User.create({ email, passwordHash, pinHash, walletId });
    await Wallet.create({ userId: user._id, walletId, balance: 1000 });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };
