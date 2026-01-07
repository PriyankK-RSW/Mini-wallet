module.exports.generateWalletId = () => {
  const prefix = "WAL"; // optional prefix
  const random = Math.floor(100000 + Math.random() * 900000); // 6 digit
  return `${prefix}${Date.now()}${random}`; // WAL167300123456789
};
