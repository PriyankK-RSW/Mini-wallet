export const hasActiveSubscription = (user) => {
  if (!user || !user.subscription) return false;

  const now = new Date();
  const endDate = new Date(user.subscription.endDate);

  return endDate > now;
};
