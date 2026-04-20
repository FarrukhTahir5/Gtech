const prisma = require("../lib/prisma");

exports.submitRequest = async (req, res) => {
  try {
    const { product_id, custom_item, condition, description, images, name, email, phone } = req.body;

    if (!condition) return res.status(400).json({ success: false, error: "Condition is required" });
    if (!product_id && !custom_item) return res.status(400).json({ success: false, error: "product_id or custom_item is required" });

    const data = {
      user_id: req.user?.id || null,
      product_id: product_id || null,
      custom_item: custom_item || null,
      condition,
      description: description || null,
      images: images || [],
      status: "pending",
    };

    const request = await prisma.buybackRequest.create({ data });

    // If not authenticated, store guest info in description
    if (!req.user && (name || email || phone)) {
      await prisma.buybackRequest.update({
        where: { id: request.id },
        data: { description: `${description || ""}\n\nGuest: ${name} | ${email} | ${phone}`.trim() },
      });
    }

    res.status(201).json({ success: true, data: request, message: "Buyback request submitted" });
  } catch (error) {
    console.error("SubmitBuyback Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;

    const [requests, total] = await Promise.all([
      prisma.buybackRequest.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, product: { select: { name: true } } },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.buybackRequest.count({ where }),
    ]);

    res.json({ success: true, data: requests, pagination: { total, page, limit } });
  } catch (error) {
    console.error("GetBuybacks Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getRequest = async (req, res) => {
  try {
    const request = await prisma.buybackRequest.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true, phone: true } }, product: { select: { name: true, brand: true } } },
    });
    if (!request) return res.status(404).json({ success: false, error: "Request not found" });
    res.json({ success: true, data: request });
  } catch (error) {
    console.error("GetBuyback Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const { status, offered_price, admin_notes } = req.body;
    const data = {};
    if (status) data.status = status;
    if (offered_price !== undefined) data.offered_price = parseFloat(offered_price);
    if (admin_notes !== undefined) data.admin_notes = admin_notes;

    const request = await prisma.buybackRequest.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: request });
  } catch (error) {
    console.error("UpdateBuyback Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
