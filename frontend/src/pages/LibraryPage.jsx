import { useEffect, useState } from "react";
import "../Css/LibraryPage.css";

const LibraryPage = () => {
const [books, setBooks] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [pin, setPin] = useState(""); 
const [selectedBook, setSelectedBook] = useState(null);
const [quantity, setQuantity] = useState(1);
const [address, setAddress] = useState("");   
const [submitting, setSubmitting] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/";
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch(`${BASE_URL}library/books`);
        if (!res.ok) throw new Error("Library service unavailable");

        const data = await res.json();
        setBooks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const openBuyForm = (book) => {
    setSelectedBook(book);
    setQuantity(1);
    setAddress("");
  };

  const closeBuyForm = () => {
    setSelectedBook(null);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      alert("Please enter address");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first");
        return;
      }

      const res = await fetch(`${BASE_URL}order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          service: "LIBRARY",
          itemId: selectedBook.id,
          itemName: selectedBook.name,
          itemPrice: selectedBook.price,
          quantity,
          address,
          pin
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Order placed successfully");
      closeBuyForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading books...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="library-container">
      <h2>Library</h2>

      <div className="book-grid">
        {books.map((book) => (
          <div className="book-card" key={book.id}>
            <img src={book.image} alt={book.name} />
            <h3>{book.name}</h3>
            <p>₹ {book.price}</p>
            <button onClick={() => openBuyForm(book)}>Buy Now</button>
          </div>
        ))}
      </div>

      {/* BUY FORM MODAL */}
      {selectedBook && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Purchase</h3>

            <form onSubmit={handleSubmitOrder}>
              <label>Book Name</label>
              <input type="text" value={selectedBook.name} disabled />

              <label>Price (₹)</label>
              <input type="number" value={selectedBook.price} disabled />

              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />

              <label>Delivery Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <label>Wallet PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />

              <p>
                <strong>Total:</strong> ₹ {selectedBook.price * quantity}
              </p>

              <div className="modal-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Place Order"}
                </button>
                <button type="button" onClick={closeBuyForm}>
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

export default LibraryPage;
