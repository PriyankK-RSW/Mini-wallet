const rateLimitMap = new Map();

const rateLimiter = (options) => {
  const {
    windowMs,
    maxRequests,
    blockDurationMs = 5 * 60 * 60 * 1000, // 5 hours
    blockMessage = "Too many attempts. Blocked for some time Try againlater."
  } = options;

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    const userData = rateLimitMap.get(ip) || {
      count: 0,
      startTime: now,
      blockedUntil: null
    };
if (userData.blockedUntil && now < userData.blockedUntil) {
      return res.status(429).json({
        message: blockMessage
      });
    }

    if (now - userData.startTime > windowMs) {
      userData.count = 0;
      userData.startTime = now;
    }

    userData.count += 1;
    if (userData.count > maxRequests) {
      userData.blockedUntil = now + blockDurationMs;
      rateLimitMap.set(ip, userData);

      return res.status(429).json({
        message: blockMessage
      });
    }

    rateLimitMap.set(ip, userData);
    next();
  };
};

module.exports = rateLimiter;
