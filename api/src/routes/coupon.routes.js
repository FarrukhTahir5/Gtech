const express = require("express");
const router = express.Router();
const couponController = require("../controllers/coupon.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

router.post("/validate", couponController.validateCoupon);
router.get("/admin/all", authenticate, requireAdmin, couponController.getAllCoupons);
router.post("/admin", authenticate, requireAdmin, couponController.createCoupon);
router.put("/admin/:id", authenticate, requireAdmin, couponController.updateCoupon);
router.delete("/admin/:id", authenticate, requireAdmin, couponController.deleteCoupon);

module.exports = router;
