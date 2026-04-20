const prisma = require("../lib/prisma");

exports.getCart = async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { user_id: req.user.id },
      include: { product: { include: { images: true, category: true } } },
      orderBy: { created_at: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("GetCart Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    const existing = await prisma.cartItem.findUnique({
      where: { user_id_product_id: { user_id: req.user.id, product_id: productId } },
    });

    let item;
    if (existing) {
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: { include: { images: true } } },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { user_id: req.user.id, product_id: productId, quantity },
        include: { product: { include: { images: true } } },
      });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error("AddCartItem Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ success: false, error: "Quantity must be >= 1" });

    const item = await prisma.cartItem.findUnique({ where: { id: req.params.itemId } });
    if (!item || item.user_id !== req.user.id) return res.status(404).json({ success: false, error: "Cart item not found" });

    const updated = await prisma.cartItem.update({
      where: { id: req.params.itemId },
      data: { quantity },
      include: { product: { include: { images: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("UpdateCartItem Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: req.params.itemId } });
    if (!item || item.user_id !== req.user.id) return res.status(404).json({ success: false, error: "Cart item not found" });

    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("RemoveCartItem Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { user_id: req.user.id } });
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("ClearCart Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
