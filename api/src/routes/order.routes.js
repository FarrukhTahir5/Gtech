const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

// Customer routes
router.post("/", authenticate, orderController.createOrder);
router.get("/my", authenticate, orderController.getMyOrders);

// Admin routes — MUST come before /:id to avoid param matching
router.get("/admin/all", authenticate, requireAdmin, dashboardController.getAllOrders);
router.put("/admin/:id/status", authenticate, requireAdmin, dashboardController.updateOrderStatus);
router.put("/admin/:id/payment", authenticate, requireAdmin, dashboardController.updatePaymentStatus);
router.put("/admin/:id/notes", authenticate, requireAdmin, dashboardController.updateAdminNotes);

// Single order by ID — must be last
router.get("/:id", authenticate, orderController.getOrderById);

module.exports = router;
