// routes/adminRoute.js
const express = require("express");
const router = express.Router();
const { importTransactionsFromCSV } = require("../controllers/addTransaction");
const authMiddleware = require("../middleware/authMiddleware");


const upload = require("../middleware/uploadMiddleware");

router.post(
  "/import-transactions",
  authMiddleware,
 
  upload.single("csv"), 
  importTransactionsFromCSV
);

module.exports = router;