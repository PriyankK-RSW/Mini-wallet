const express = require("express");
const router = express.Router();
const { subscribeUser } = require("../controllers/SubscriptionControlle");
const  authMiddleware  = require("../middleware/authMiddleware"); 


router.post("/subscribe", authMiddleware ,  subscribeUser);

module.exports = router;
