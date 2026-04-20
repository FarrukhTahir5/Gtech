const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { authenticate } = require("../middleware/authenticate");

router.get("/", authenticate, cartController.getCart);
router.post("/", authenticate, cartController.addItem);
router.put("/:itemId", authenticate, cartController.updateQuantity);
router.delete("/:itemId", authenticate, cartController.removeItem);
router.delete("/", authenticate, cartController.clearCart);

module.exports = router;
