const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");
const upload = require("../middleware/upload");

// Public
router.get("/", productController.getProducts);
router.get("/slug/:slug", productController.getProductBySlug);
router.get("/:id", productController.getProductById);

// Admin — multipart (with images) or JSON (without images)
router.post("/", authenticate, requireAdmin, (req, res, next) => {
  upload.array("images", 6)(req, res, (err) => {
    if (err) {
      // If multer fails (e.g. not multipart), continue without files
      return next();
    }
    next();
  });
}, productController.createProduct);

router.put("/:id", authenticate, requireAdmin, (req, res, next) => {
  upload.array("images", 6)(req, res, (err) => {
    if (err) {
      return next();
    }
    next();
  });
}, productController.updateProduct);

router.delete("/:id", authenticate, requireAdmin, productController.deleteProduct);

module.exports = router;
