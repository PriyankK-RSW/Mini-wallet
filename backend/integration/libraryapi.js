const axios = require("axios");

exports.getLibraryBooks = async () => {
  const res = await axios.get(
    "https://api.itbook.store/1.0/new"
  );

  return res.data.books.slice(0, 20).map(book => ({
    id: book.isbn13,
    name: book.title,
    price: Math.floor(Math.random() * 150) + 300,
    description: book.subtitle,
    image: book.image,
  }));
};