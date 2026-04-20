const prisma = require("../lib/prisma");

exports.getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { user_id: req.user.id },
      include: { product: { include: { images: true, category: true } } },
      orderBy: { created_at: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("GetWishlist Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: "productId required" });

    const existing = await prisma.wishlistItem.findUnique({
      where: { user_id_product_id: { user_id: req.user.id, product_id: productId } },
    });
    if (existing) return res.status(400).json({ success: false, error: "Already in wishlist" });

    const item = await prisma.wishlistItem.create({
      data: { user_id: req.user.id, product_id: productId },
      include: { product: { include: { images: true } } },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error("AddWishlist Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const item = await prisma.wishlistItem.findFirst({
      where: { user_id: req.user.id, product_id: req.params.productId },
    });
    if (!item) return res.status(404).json({ success: false, error: "Not in wishlist" });
    await prisma.wishlistItem.delete({ where: { id: item.id } });
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    console.error("RemoveWishlist Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.checkItem = async (req, res) => {
  try {
    const item = await prisma.wishlistItem.findUnique({
      where: { user_id_product_id: { user_id: req.user.id, product_id: req.params.productId } },
    });
    res.json({ success: true, data: { inWishlist: !!item } });
  } catch (error) {
    console.error("CheckWishlist Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
