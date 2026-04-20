const prisma = require("../lib/prisma");

// Utility to parse boolean values from various inputs (JSON or FormData strings)
const parseBool = (val, defaultVal) => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return Boolean(val);
};

exports.getProducts = async (req, res) => {
  try {
    const { categoryId, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (categoryId) where.category_id = categoryId;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { images: true, category: true, specs: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    console.error("GetProducts Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: true, category: true, specs: true,
        reviews: { where: { is_approved: true }, include: { user: { select: { name: true } } }, orderBy: { created_at: "desc" } },
      },
    });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    const agg = await prisma.review.aggregate({ where: { product_id: product.id, is_approved: true }, _avg: { rating: true }, _count: true });
    res.json({ success: true, data: { ...product, rating_avg: agg._avg.rating || 0, review_count: agg._count } });
  } catch (error) {
    console.error("GetProductBySlug Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true, category: true, specs: true, reviews: { where: { is_approved: true }, include: { user: { select: { name: true } } } } },
    });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("GetProductById Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    let { name, slug, description, short_desc, brand, model_number, sku, price, compare_price, cost_price, stock_quantity, category_id, tags, is_active, is_featured, is_buyback, buyback_price, specs } = req.body;

    // Accept field name aliases from different clients
    if (!short_desc && req.body.short_description) short_desc = req.body.short_description;
    if (!description && req.body.full_description) description = req.body.full_description;
    if (!specs && req.body.specifications) specs = req.body.specifications;

    // Ensure required fields have defaults
    if (!description) description = short_desc || name || "";
    if (!slug) slug = name ? name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() : `product-${Date.now()}`;

    // Build image records from multer files or base64
    const imageRecords = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        // Use relative URL instead of local path
        const imageUrl = `/api/uploads/${file.filename}`;
        imageRecords.push({ url: imageUrl, is_primary: index === 0 });
      });
    } else if (req.body.image_base64) {
      const images = Array.isArray(req.body.image_base64) ? req.body.image_base64 : [req.body.image_base64];
      images.forEach((img, index) => {
        imageRecords.push({ url: img, is_primary: index === 0 });
      });
    }

    const product = await prisma.product.create({
      data: {
        name, slug, description, short_desc: short_desc || null, brand: brand || null, model_number: model_number || null, sku: sku || null,
        price: parseFloat(price),
        compare_price: compare_price ? parseFloat(compare_price) : null,
        cost_price: cost_price ? parseFloat(cost_price) : null,
        stock_quantity: parseInt(stock_quantity) || 0,
        ...(category_id ? { category: { connect: { id: category_id } } } : {}),
        tags: tags || [],
        is_active: parseBool(is_active, true),
        is_featured: parseBool(is_featured, false),
        is_buyback: parseBool(is_buyback, false),
        buyback_price: buyback_price ? parseFloat(buyback_price) : null,
        specs: { create: specs ? (typeof specs === "string" ? JSON.parse(specs) : specs) : [] },
        ...(imageRecords.length > 0 ? { images: { create: imageRecords } } : {}),
      },
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("CreateProduct Error:", error);
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, slug, description, short_desc, brand, model_number, sku, price, compare_price, cost_price, stock_quantity, category_id, tags, is_active, is_featured, is_buyback, buyback_price, specs } = req.body;

    // Accept field name aliases
    if (!short_desc && req.body.short_description) short_desc = req.body.short_description;
    if (!description && req.body.full_description) description = req.body.full_description;
    if (!specs && req.body.specifications) specs = req.body.specifications;

    const data = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (short_desc !== undefined) data.short_desc = short_desc;
    if (brand !== undefined) data.brand = brand;
    if (model_number !== undefined) data.model_number = model_number;
    if (sku !== undefined) data.sku = sku;
    if (price !== undefined) data.price = parseFloat(price);
    if (compare_price !== undefined) data.compare_price = compare_price ? parseFloat(compare_price) : null;
    if (cost_price !== undefined) data.cost_price = cost_price ? parseFloat(cost_price) : null;
    if (stock_quantity !== undefined) data.stock_quantity = parseInt(stock_quantity);
    if (category_id !== undefined) {
      if (category_id && category_id !== "") {
        data.category = { connect: { id: category_id } };
      } else {
        data.category = { disconnect: true };
      }
    }
    if (tags !== undefined) data.tags = tags;
    if (is_active !== undefined) data.is_active = parseBool(is_active, true);
    if (is_featured !== undefined) data.is_featured = parseBool(is_featured, false);
    if (is_buyback !== undefined) data.is_buyback = parseBool(is_buyback, false);
    if (buyback_price !== undefined) data.buyback_price = buyback_price ? parseFloat(buyback_price) : null;

    if (specs) {
      const parsedSpecs = typeof specs === "string" ? JSON.parse(specs) : specs;
      await prisma.productSpec.deleteMany({ where: { product_id: id } });
      data.specs = { create: parsedSpecs };
    }

    if (req.files && req.files.length > 0) {
      data.images = { 
        create: req.files.map((file, index) => ({ 
          url: `/api/uploads/${file.filename}`, 
          is_primary: index === 0 
        })) 
      };
    } else if (req.body.image_base64) {
      const images = Array.isArray(req.body.image_base64) ? req.body.image_base64 : [req.body.image_base64];
      data.images = { 
        create: images.map((img, index) => ({ 
          url: img, 
          is_primary: index === 0 
        })) 
      };
    }

    const product = await prisma.product.update({ where: { id }, data, include: { images: true, specs: true, category: true } });
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("UpdateProduct Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("DeleteProduct Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
