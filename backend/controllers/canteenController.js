const { getCanteenFoods } = require("../integration/Canteenapi");

exports.getCanteenFoods = async (req, res) => {
  
  const foods = await getCanteenFoods();
  res.json(foods);
};
