import { useEffect, useState } from "react";
import "../Css/foodItems.css";
import toast from "react-hot-toast";  
const FoodItem = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState(false);
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

   const handleBuy = async (food) => {
    try {
      setBuying(true);

      const token = localStorage.getItem("token"); // JWT stored after login
      if (!token) {
        toast.error ("Please login first");
        return;
      }

      const res = await fetch("http://localhost:5000/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          service: "CANTEEN",
          itemId: food.id,
          itemName: food.name,
          itemPrice: food.price,
          quantity: 1,
          additionalDetails: {
            description: food.description
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Order failed");
      }

      toast.success("Order placed successfully");

      console.log("Order Response:", data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuying(false);
    }
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
              disabled={buying}
              onClick={() => handleBuy(food)}
            >
              {buying ? "Processing..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodItem;
