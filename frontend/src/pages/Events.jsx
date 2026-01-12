import { useEffect, useState } from "react";
import "../Css/foodItems.css";
import toast from "react-hot-toast";

const Events = () => {
  const [events, setevents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState(false);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/events/events");

        if (!res.ok) {
          throw new Error("Events service unavailable");
        }

        const data = await res.json();
        setevents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleBuy = async (events) => {
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
          service: "EVENTS",
          itemId: events.id,
          itemName: events.name,
          itemPrice: events.price,
          quantity: 1,
          additionalDetails: {
            description: events.description
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Order failed");
      }

      toast.success("Registered successfully");

      console.log("Order Response:", data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <p className="info-text">Loading events...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="library-container">
      <h2>Events</h2>

      <div className="food-grid">
        {events.map((events) => (
          <div className="food-card" key={events.id}>
            <img
              src={events.image}
              alt={events.name}
              className="food-image"
            />

            <h3 className="food-title">{events.name}</h3>

            <p className="food-price">₹ {events.price}</p>
            <p className="food-description">{events.description}</p>
            <button
              className="buy-btn"
              onClick={() => handleBuy(events)}
            >
              Register now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
