const fs = require("fs");
const csv = require("csv-parser");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { generateTransactionRef } = require("../utils/generateTransactionRef");

exports.importTransactionsFromCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No CSV file uploaded" });
  }

  const results = [];
  const errors = [];
  const filePath = req.file.path;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    if (results.length === 0) {
      return res.status(400).json({ message: "CSV file is empty" });
    }
  
    const transactionsToInsert = [];
    const walletBalanceUpdates = new Map();
    const userWalletMap = new Map(); 

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNum = i + 2;

      const userId = row.userId?.trim();
      const amountStr = row.amount?.trim();
      const type = row.type?.trim().toUpperCase();
      const counterparty = row.counterpartyWalletId?.trim() || "UNKNOWN";
      const createdAt = row.createdAt?.trim();

      if (!userId || !amountStr || !type) {
        errors.push(`Row ${rowNum}: Missing required fields (userId, amount, type)`);
        continue;
      }

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${rowNum}: Invalid amount`);
        continue;
      }

      if (!["DEPOSIT", "WITHDRAW", "DEBIT", "CREDIT"].includes(type)) {
        errors.push(`Row ${rowNum}: Invalid type`);
        continue;
      }

      let walletId = userWalletMap.get(userId);

      if (!walletId) {
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          errors.push(`Row ${rowNum}: Wallet not found for userId ${userId}`);
          continue;
        }
        walletId = wallet.walletId; 
         userWalletMap.set(userId, walletId);
      }

      const transaction = {
        userId,
        walletId,        
        amount,
        type,
        counterpartyWalletId: counterparty,
        reference: generateTransactionRef(),
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        balanceAfter: 0,
      };

      transactionsToInsert.push(transaction);

      const netChange = type === "DEPOSIT" || type === "CREDIT" ? amount : -amount;
      walletBalanceUpdates.set(userId, (walletBalanceUpdates.get(userId) || 0) + netChange);
    }

    if (errors.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    await Transaction.insertMany(transactionsToInsert);

    for (const [userId, netChange] of walletBalanceUpdates) {
      if (netChange !== 0) {
        await Wallet.updateOne({ userId }, { $inc: { balance: netChange } });
      }
    }

    fs.unlinkSync(filePath);

    res.json({
      message: "Transactions imported successfully",
      count: transactionsToInsert.length,
    });
  } catch (err) {
    console.error("CSV Import Error:", err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: "Import failed", error: err.message });
  }
};