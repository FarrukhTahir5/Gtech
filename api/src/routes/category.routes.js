const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { authenticate, requireAdmin } = require("../middleware/authenticate");

// Public - Get all categories
router.get("/", categoryController.getCategories);

// Admin Only - CRUD categories
router.post("/", authenticate, requireAdmin, categoryController.createCategory);
router.put("/:id", authenticate, requireAdmin, categoryController.updateCategory);
router.delete("/:id", authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;
