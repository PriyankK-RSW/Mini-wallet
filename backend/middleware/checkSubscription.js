exports.checkSubscription = (benefitType) => async (req, res, next) => {
  const user = req.user;
  const now = new Date();


  if (!user.subscription || new Date(user.subscription.endDate) < now) {
    return res.status(403).json({ message: "No active subscription" });
  }


  const used = user.subscription.benefitsUsed[benefitType] || 0;
  const limit = getPlanLimit(user.subscription.plan, benefitType);

  if (used >= limit) {
    return res.status(403).json({ message: `${benefitType} limit reached` });
  }

  next();
};


function getPlanLimit(plan, type) {
  const limits = {
    CANTEEN_MONTHLY: { meals: 60, events: 2, books: 2 },
    EVENTS_MONTHLY: { meals: 0, events: 15, books: 0 },
    LIBRARY_MONTHLY: { meals: 0, events: 0, books: 100 },
  };
  return limits[plan][type] || 0;
}
