const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

router.get("/stats", authenticate, requireAdmin, dashboardController.getStats);
router.get("/low-stock", authenticate, requireAdmin, dashboardController.getLowStock);

module.exports = router;
