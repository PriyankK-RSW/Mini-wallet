import { useEffect, useState } from "react";
import "../Css/foodItems.css";

const FoodItem = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch("http://localhost:5000/canteen/foods");

        if (!res.ok) {
          throw new Error("Canteen service unavailable");
        }

        const data = await res.json();
        setFoods(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, []);

  const handleBuy = (foods) => {
    console.log("Buy food:", foods);

  };

  if (loading) return <p className="info-text">Loading foods...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="library-container">
      <h2>Canteen</h2>

      <div className="food-grid">
        {foods.map((food) => (
          <div className="food-card" key={food.id}>
            <img
              src={food.image}
              alt={food.name}
              className="food-image"
            />

            <h3 className="food-title">{food.name}</h3>

            <p className="food-price">₹ {food.price}</p>
            <p className="food-description">{food.description}</p>
            <button
              className="buy-btn"
              onClick={() => handleBuy(food)}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodItem;
