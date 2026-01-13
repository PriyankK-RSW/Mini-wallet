const authorizeDashboard = (allowedEmails) => {
  return (req, res, next) => {
    if (!allowedEmails.includes(req.user.email)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = authorizeDashboard;





