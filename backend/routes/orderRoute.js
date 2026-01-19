const express = require("express");
const router = express.Router();
const { createOrder , getOrders , getorderByservice , getOrderById , getAdminDashboard , getServiceDashboard } = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

;const authorizeDashboard = require("../middleware/authorizationMiddleware")
router.post("/create", authMiddleware,  createOrder);


router.get("/", authMiddleware,  getOrders);
router.get(
  "/Dashboard/admin",
  authMiddleware,
  authorizeDashboard(["admin@gmail.com"]),
  getAdminDashboard
);

router.get(
  "/Dashboard/service",
  authMiddleware,
  authorizeDashboard(["canteen@gmail.com","events@gmail.com","library@gmail.com"]),
  getServiceDashboard
);

module.exports = router;
