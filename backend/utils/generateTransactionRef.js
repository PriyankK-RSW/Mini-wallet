const  generateTransactionRef = async () => {
  return `TXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
};

module.exports = { generateTransactionRef };
