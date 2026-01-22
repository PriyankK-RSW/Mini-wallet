import { useEffect, useState } from "react";
import "../Css/foodItems.css";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

function getPlanLimit(plan) {
  const limits = {
    CANTEEN_MONTHLY: 30,

  };
  return limits[plan] ?? Infinity;
}

const FoodItem = () => {
  const { user } = useAuthStore();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [monthlyUsed, setMonthlyUsed] = useState(0);
  const [usageLoading, setUsageLoading] = useState(true);

  const API_BASE =  import.meta.env.VITE_BASE_URL;

  const isSubscriptionActive =
    user?.subscription &&
    user.subscription.plan === "CANTEEN_MONTHLY" &&
    new Date(user.subscription.endDate) > new Date();

  const monthlyLimit = getPlanLimit(user?.subscription?.plan);
  const canUseFreeMeal = isSubscriptionActive && monthlyUsed < monthlyLimit;

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch(`${API_BASE}/canteen/foods`);
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

  useEffect(() => {
    const fetchUsage = async () => {
      if (!isSubscriptionActive) {
        setUsageLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/wallet/usage/meals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch usage");
        const data = await res.json();
        setMonthlyUsed(data.used || 0);
      } catch (err) {
        console.error("Failed to load usage:", err);
        toast.error("Could not check subscription usage");
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsage();
  }, [isSubscriptionActive]);

  const openForm = (food) => {
    setSelectedFood(food);
    setQuantity(1);
    setAddress("");
    setPin("");
  };

  const closeForm = () => {
    setSelectedFood(null);
    setPin("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) return toast.error("Please enter your PIN");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) return toast.error("Please login first");

      const res = await fetch(`${API_BASE}/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          service: "CANTEEN",
          itemId: selectedFood.id,
          itemName: selectedFood.name,
          itemPrice: selectedFood.price,
          quantity,
          address,
          pin,
          benefitType: canUseFreeMeal ? "meals" : null, // backend can use this to deduct benefit
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");

      toast.success(
        canUseFreeMeal
          ? `Free meal redeemed! (${monthlyUsed + 1}/${monthlyLimit})`
          : "Order placed successfully"
      );

      // Optional: refresh usage after successful free order
      if (canUseFreeMeal) {
        setMonthlyUsed(prev => prev + quantity); // optimistic update (adjust if quantity > 1 supported)
      }

      closeForm();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || usageLoading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="library-container">
      <h2>Canteen Menu</h2>

      {isSubscriptionActive && (
        <div className="subscription-notice">
          {canUseFreeMeal ? (
            <p className="free-meal-info">
              Subscription active • {monthlyLimit - monthlyUsed} free meals remaining this month
            </p>
          ) : (
            <p className="limit-reached">
              Monthly free meal limit reached • Regular pricing applies
            </p>
          )}
        </div>
      )}

      <div className="food-grid">
        {foods.map((food) => (
          <div className="food-card" key={food.id || food._id}>
            <img src={food.image} alt={food.name} />
            <h3>{food.name}</h3>
            <p className="price">₹{food.price}</p>
            <p className="description">{food.description}</p>
            <button onClick={() => openForm(food)}>Buy Now</button>
          </div>
        ))}
      </div>

      {selectedFood && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Your Order</h3>
            <form onSubmit={handleSubmit}>
              <input value={selectedFood.name} disabled className="disabled-input" />
              
              <div className="price-display">
                <label>Price per item</label>
                <input
                  value={
                    canUseFreeMeal
                      ? "₹0 (Free with subscription)"
                      : `₹${selectedFood.price}`
                  }
                  disabled
                  className={canUseFreeMeal ? "free-price" : ""}
                />
              </div>

              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, +e.target.value))}
              />

              <label>Delivery Address</label>
              <textarea
                placeholder="Enter full delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <label>Wallet PIN (for authorization)</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                maxLength={6}
              />

              <div className="total-line">
                <strong>Total Amount:</strong>
                <span className={canUseFreeMeal ? "total-free" : "total-normal"}>
                  {canUseFreeMeal ? "₹0" : `₹${selectedFood.price * quantity}`}
                </span>
              </div>

              {canUseFreeMeal && (
                <p className="benefit-note">
                  This order will use your subscription benefit
                </p>
              )}

              <div className="modal-actions">
                <button type="submit" disabled={submitting || !address.trim()}>
                  {submitting ? "Placing order..." : "Place Order"}
                </button>
                <button type="button" onClick={closeForm} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodItem;