import { useEffect, useState } from "react";
import "../Css/LibraryPage.css";

const LibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleBuy = (book) => {
    console.log("Buy book:", book);

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
              onClick={() => handleBuy(book)}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryPage;
