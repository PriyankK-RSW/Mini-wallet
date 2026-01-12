import { useEffect, useState } from "react";
import "../Css/LibraryPage.css";
import toast from "react-hot-toast";


const LibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("http://localhost:5000/library/books");

        if (!res.ok) {
          throw new Error("Library service unavailable");
        }

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

  const handleBuy = async (book) => {
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
          service: "LIBRARY",
          itemId: book.id,
          itemName: book.name,
          itemPrice: book.price,
          quantity: 1,
          additionalDetails: {
            description: book.description
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

  if (loading) return <p className="info-text">Loading books...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="library-container">
      <h2>Library</h2>

      <div className="book-grid">
        {books.map((book) => (
          <div className="book-card" key={book.id}>
            <img
              src={book.image}
              alt={book.name}
              className="book-image"
            />

            <h3 className="book-title">{book.name}</h3>

            <p className="book-price">₹ {book.price}</p>
            <p className="book-description">{book.description}</p>

            <button
              className="buy-btn"
              disabled={buying}
              onClick={() => handleBuy(book)}
            >
              {buying ? "Processing..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryPage;
