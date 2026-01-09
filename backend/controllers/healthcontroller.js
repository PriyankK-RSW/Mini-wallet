const mongoose = require("mongoose");
const redis = require("../config/redis"); 
const stripe = require("../config/stripe");

const healthCheck = async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
    system: {}
  };

  try {

    health.services.mongodb = mongoose.connection.readyState === 1
      ? "UP"
      : "DOWN";

    try {
      await redis.ping();
      health.services.redis = "UP";
    } catch {
      health.services.redis = "DOWN";
      health.status = "DEGRADED";
    }

    try {
      await stripe.balance.retrieve();
      health.services.stripe = "UP";
    } catch {
      health.services.stripe = "DOWN";
      health.status = "DEGRADED";
    }


    health.system.memory = {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed
    };

    health.system.nodeVersion = process.version;
    health.system.environment = process.env.NODE_ENV || "development";

   
    if (health.services.mongodb === "DOWN") {
      health.status = "DOWN";
      return res.status(503).json(health);
    }

    res.status(200).json(health);

  } catch (err) {
    res.status(500).json({
      status: "DOWN",
      error: "Health check failed",
      details: err.message
    });
  }
};

module.exports = { healthCheck };
