const axios = require("axios");

exports.getCanteenFoods = async () => {
  const res = await axios.get(
    "https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian"
  );

  return res.data.meals.slice(0, 50).map(food => ({
    id: food.idMeal,
    name: food.strMeal,
    price: Math.floor(Math.random() * 150) + 500,
    description: "Delicious canteen meal",
    image: food.strMealThumb
  }));
};
