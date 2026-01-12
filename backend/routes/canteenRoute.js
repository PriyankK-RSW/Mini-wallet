const router = require("express").Router();
const { getCanteenFoods } = require("../controllers/canteenController");
    
router.get("/foods", getCanteenFoods);

module.exports = router;