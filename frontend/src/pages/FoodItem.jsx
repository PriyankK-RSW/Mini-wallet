import { useEffect, useState } from "react";
import "../Css/foodItems.css";
import toast from "react-hot-toast";

const FoodItem = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch("http://localhost:5000/canteen/foods");
        if (!res.ok) throw new Error("Canteen service unavailable");

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

  const openForm = (food) => {
    setSelectedFood(food);
    setQuantity(1);
    setAddress("");
  };

  const closeForm = () => setSelectedFood(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) return toast.error("Please login first");

      const res = await fetch("http://localhost:5000/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          service: "CANTEEN",
          itemId: selectedFood.id,
          itemName: selectedFood.name,
          itemPrice: selectedFood.price,
          quantity,
          address 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Order placed successfully");
      closeForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading foods...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="library-container">
      <h2>Canteen</h2>

      <div className="food-grid">
        {foods.map((food) => (
          <div className="food-card" key={food.id}>
            <img src={food.image} alt={food.name} />
            <h3>{food.name}</h3>
            <p>₹ {food.price}</p>
            <p>{food.description}</p>
            <button onClick={() => openForm(food)}>Buy Now</button>
          </div>
        ))}
      </div>

      {selectedFood && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Order</h3>

            <form onSubmit={handleSubmit}>
              <input value={selectedFood.name} disabled />
              <input value={selectedFood.price} disabled />

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
              />

              <textarea
                placeholder="Delivery Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <p><strong>Total:</strong> ₹ {selectedFood.price * quantity}</p>

              <div className="modal-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Place Order"}
                </button>
                <button type="button" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodItem;
  