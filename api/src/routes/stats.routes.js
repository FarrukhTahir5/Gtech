const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

router.get("/", authenticate, requireAdmin, statsController.getStats);

module.exports = router;
