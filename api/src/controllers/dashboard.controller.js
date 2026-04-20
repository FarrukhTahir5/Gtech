const prisma = require("../lib/prisma");

exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [revenue, todayOrders, pendingOrders, totalProducts, totalUsers, recentOrders] = await Promise.all([
      prisma.order.aggregate({ _sum: { total_amount: true }, where: { payment_status: "paid" } }),
      prisma.order.count({ where: { created_at: { gte: today } } }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.product.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { created_at: "desc" },
        include: { user: { select: { name: true } }, items: { select: { id: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenue._sum.total_amount || 0,
        counts: { orders: todayOrders, pending: pendingOrders, products: totalProducts, users: totalUsers },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("DashboardStats Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { stock_quantity: { lte: prisma.product.fields.low_stock_alert } },
      orderBy: { stock_quantity: "asc" },
      include: { category: { select: { name: true } } },
      take: 50,
    });

    // Fallback: get products with stock <= 5
    const lowStock = products.length > 0 ? products : await prisma.product.findMany({
      where: { stock_quantity: { lte: 5 } },
      orderBy: { stock_quantity: "asc" },
      include: { category: { select: { name: true } } },
      take: 50,
    });

    res.json({ success: true, data: lowStock });
  } catch (error) {
    console.error("LowStock Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, dateFrom, dateTo } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(dateFrom);
      if (dateTo) where.created_at.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { order_number: { contains: search, mode: "insensitive" } },
        { ship_name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { items: true, user: { select: { name: true, email: true } } },
        orderBy: { created_at: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: orders, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error("GetAllOrders Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, tracking_number, courier, cancel_reason } = req.body;
    if (!status) return res.status(400).json({ success: false, error: "Status is required" });

    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: "Order not found" });

    const data = { status };
    if (tracking_number) data.tracking_number = tracking_number;
    if (courier) data.courier = courier;
    if (cancel_reason) data.cancel_reason = cancel_reason;
    if (status === "shipped") data.shipped_at = new Date();
    if (status === "delivered") data.delivered_at = new Date();
    if (status === "cancelled") data.cancelled_at = new Date();

    const order = await prisma.order.update({ where: { id: req.params.id }, data, include: { items: true } });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("UpdateOrderStatus Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: "Order not found" });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { payment_status: "paid" },
    });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("UpdatePaymentStatus Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updateAdminNotes = async (req, res) => {
  try {
    const { admin_notes } = req.body;
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: "Order not found" });

    const order = await prisma.order.update({ where: { id: req.params.id }, data: { admin_notes } });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("UpdateAdminNotes Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
