const express = require("express");
const { register, login } = require("../controllers/authController.js"); // make sure this is CommonJS too!

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;
