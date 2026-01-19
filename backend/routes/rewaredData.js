 const router = require("./orderRoute");
 const { getRewardsPoints , redeemRewardPoints } = require("../controllers/rewardController");
 const authMiddleware = require("../middleware/authMiddleware");

router.get("/rewardsPoints", authMiddleware, getRewardsPoints);
router.post("/redeemPoints", authMiddleware, redeemRewardPoints);


module.exports = router;