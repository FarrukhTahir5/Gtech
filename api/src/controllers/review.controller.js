const prisma = require("../lib/prisma");

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { product_id: productId, is_approved: true },
        include: { user: { select: { name: true } } },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { product_id: productId, is_approved: true } }),
    ]);

    // Average rating
    const agg = await prisma.review.aggregate({
      where: { product_id: productId, is_approved: true },
      _avg: { rating: true },
      _count: true,
    });

    res.json({
      success: true,
      data: reviews,
      meta: { total, page, limit, average: agg._avg.rating || 0, count: agg._count },
    });
  } catch (error) {
    console.error("GetReviews Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { productId, rating, title, body } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "productId and rating (1-5) are required" });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    // Check if user already reviewed this product
    const existing = await prisma.review.findFirst({
      where: { product_id: productId, user_id: req.user.id },
    });
    if (existing) return res.status(400).json({ success: false, error: "You already reviewed this product" });

    const review = await prisma.review.create({
      data: {
        product_id: productId,
        user_id: req.user.id,
        rating,
        title: title || null,
        body: body || null,
        is_approved: false,
      },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json({ success: true, data: review, message: "Review submitted for approval" });
  } catch (error) {
    console.error("SubmitReview Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.approved === "true") where.is_approved = true;
    if (req.query.approved === "false") where.is_approved = false;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, product: { select: { name: true } } },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    res.json({ success: true, data: reviews, pagination: { total, page, limit } });
  } catch (error) {
    console.error("GetAllReviews Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { is_approved: true },
    });
    res.json({ success: true, data: review });
  } catch (error) {
    console.error("ApproveReview Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("DeleteReview Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
