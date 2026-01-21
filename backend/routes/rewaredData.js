 const router = require("./orderRoute");
 const { getRewardsPoints , redeemRewardPoints , giftPoints  } = require("../controllers/rewardController");
 const authMiddleware = require("../middleware/authMiddleware");


router.get("/rewardsPoints", authMiddleware, getRewardsPoints);
router.post("/redeemPoints", authMiddleware, redeemRewardPoints);
router.post("/giftPoints" , authMiddleware , giftPoints);

module.exports = router;