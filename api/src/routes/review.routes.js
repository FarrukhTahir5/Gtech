const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

router.get("/product/:productId", reviewController.getProductReviews);
router.post("/", authenticate, reviewController.submitReview);
router.get("/admin/all", authenticate, requireAdmin, reviewController.getAllReviews);
router.put("/admin/:id/approve", authenticate, requireAdmin, reviewController.approveReview);
router.delete("/admin/:id", authenticate, requireAdmin, reviewController.deleteReview);

module.exports = router;
