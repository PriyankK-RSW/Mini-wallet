import { useEffect, useState } from "react";
import "../Css/foodItems.css";

const Events = () => {
  const [events, setevents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleBuy = (events) => {
    console.log("Buy event:", events);

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
