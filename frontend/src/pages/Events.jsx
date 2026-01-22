import { useEffect, useState } from "react";
import "../Css/foodItems.css";
import toast from "react-hot-toast";
import "../Css/events.css";
const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const API_BASE =  import.meta.env.VITE_BASE_URL;

  const [pin, setPin] = useState(""); 
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`https://mini-wallet-production-8712.up.railway.app/events/events`);
        if (!res.ok) throw new Error("Events service unavailable");

        const data = await res.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const openForm = (event) => {
    setSelectedEvent(event);
    setQuantity(1);
    setAddress("");
  };

  const closeForm = () => setSelectedEvent(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");
      if (!token) return toast.error("Please login first");

      const res = await fetch(`${BASE_URL}order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          service: "EVENTS",
          itemId: selectedEvent.id,
          itemName: selectedEvent.name,
          itemPrice: selectedEvent.price,
          quantity,
          address,
          pin
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Registered successfully");
      closeForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="library-container">
      <h2>Events</h2>

      <div className="food-grid">
        {events.map((event) => (
          <div className="food-card" key={event.id}>
            <img src={event.image} alt={event.name} />
            <h3>{event.name}</h3>
            <p>₹ {event.price}</p>
            <p>{event.description}</p>
            <button onClick={() => openForm(event)}>Register</button>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Event Registration</h3>

            <form onSubmit={handleSubmit}>
              <label>Event</label>
              <input value={selectedEvent.name} disabled />

              <label>Price</label>
              <input value={selectedEvent.price} disabled />

              <label>Tickets</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
              />

              <label>Address / Notes</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <label>Wallet PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />

              <p><strong>Total:</strong> ₹ {selectedEvent.price * quantity}</p>

              <div className="modal-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Confirm"}
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

export default Events;
