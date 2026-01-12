const { getLibraryBooks } = require("../integration/libraryapi");

exports.getLibraryBooks = async (req, res) => {
  
  const books = await getLibraryBooks();
  res.json(books);
};
