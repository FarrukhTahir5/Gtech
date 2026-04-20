const prisma = require("../lib/prisma");


exports.getStats = async (req, res) => {
  try {
    const [productCount, orderCount, userCount, totalSales] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: { payment_status: "paid" },
      }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: { user: { select: { name: true } } },
    });

    res.json({
      success: true,
      data: {
        counts: {
          products: productCount,
          orders: orderCount,
          users: userCount,
        },
        revenue: totalSales._sum.total_amount || 0,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("GetStats Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
