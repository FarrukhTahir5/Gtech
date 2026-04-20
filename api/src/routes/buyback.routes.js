const express = require("express");
const router = express.Router();
const buybackController = require("../controllers/buyback.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

router.post("/", buybackController.submitRequest);
router.get("/admin/all", authenticate, requireAdmin, buybackController.getAllRequests);
router.get("/admin/:id", authenticate, requireAdmin, buybackController.getRequest);
router.put("/admin/:id", authenticate, requireAdmin, buybackController.updateRequest);

module.exports = router;
