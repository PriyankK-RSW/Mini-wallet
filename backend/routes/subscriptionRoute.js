const express = require("express");
const router = express.Router();
const { subscribeUser, getUsageInfo } = require("../controllers/SubscriptionControlle");
const  authMiddleware  = require("../middleware/authMiddleware"); 


router.post("/subscribe", authMiddleware ,  subscribeUser);
router.get("/usage/:benefitType" ,authMiddleware , getUsageInfo)
module.exports = router;
