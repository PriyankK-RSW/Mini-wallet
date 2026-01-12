const router = require("express").Router();
const libraryCtrl = require("../controllers/libraryController");

router.get("/books", libraryCtrl.getLibraryBooks);

module.exports = router;
