const prisma = require("../lib/prisma");


// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("GetCategories Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Create a category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    let { name, slug, image_url, parent_id, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "Category name is required" });
    }

    // Auto-generate slug if not provided
    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        image_url: image_url || null,
        parent_id: parent_id || null,
        sort_order: parseInt(sort_order) || 0,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("CreateCategory Error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, error: "Category or slug already exists" });
    }
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

// Update a category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, slug, image_url, parent_id, sort_order } = req.body;

    const data = {};
    if (name) {
      data.name = name;
      if (!slug) {
        data.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }
    }
    if (slug) data.slug = slug;
    if (image_url !== undefined) data.image_url = image_url || null;
    if (parent_id !== undefined) data.parent_id = parent_id || null;
    if (sort_order !== undefined) data.sort_order = parseInt(sort_order) || 0;

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    console.error("UpdateCategory Error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, error: "Category or slug already exists" });
    }
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Delete a category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("DeleteCategory Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
