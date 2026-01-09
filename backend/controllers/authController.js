const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const { generateWalletId } = require("../utils/generateWalletId");
require("dotenv").config();


const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
//input validation can be added

const validateEmail = (email) => {  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {  
  return password && password.length >= 6 ;
};

const validatePin = (pin) => {  
  const pinRegex = /^\d{4}$/;
  return pinRegex.test(pin);
};

const sanitizeInput = (input) => {  
  return input.replace(/[<>'"]/g, '');
};

const register = async (req, res) => {
  try {
    const { email, password, pin } = req.body;


    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    if (!validatePin(pin)) {
      return res.status(400).json({ message: "PIN must be a 4-digit number" });
    }

    const sanitizedEmail = sanitizeInput(email);
    
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }
    
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const pinHash = await bcrypt.hash(pin, saltRounds);
    const walletId = generateWalletId();

    const user = await User.create({ email: sanitizedEmail, passwordHash, pinHash, walletId });
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
    const sanitizedEmail = sanitizeInput(email);

    const user = await User.findOne({ email : sanitizedEmail });
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
