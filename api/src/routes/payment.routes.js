const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticate } = require("../middleware/authenticate");

router.post("/create-checkout-session", authenticate, paymentController.createCheckoutSession);

module.exports = router;
