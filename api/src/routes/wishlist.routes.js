const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
const { authenticate } = require("../middleware/authenticate");

router.get("/", authenticate, wishlistController.getWishlist);
router.post("/", authenticate, wishlistController.addItem);
router.get("/check/:productId", authenticate, wishlistController.checkItem);
router.delete("/:productId", authenticate, wishlistController.removeItem);

module.exports = router;
