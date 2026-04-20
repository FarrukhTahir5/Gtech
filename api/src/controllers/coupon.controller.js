const prisma = require("../lib/prisma");

exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ success: false, error: "Coupon code is required" });

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return res.status(404).json({ success: false, error: "Invalid coupon code" });
    if (!coupon.is_active) return res.status(400).json({ success: false, error: "Coupon is not active" });
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return res.status(400).json({ success: false, error: "Coupon has expired" });
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return res.status(400).json({ success: false, error: "Coupon usage limit reached" });
    if (parseFloat(coupon.min_order_value) > parseFloat(orderAmount || 0)) return res.status(400).json({ success: false, error: `Minimum order amount is Rs. ${coupon.min_order_value}` });

    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (parseFloat(orderAmount) * parseFloat(coupon.value)) / 100;
      if (coupon.max_discount) discount = Math.min(discount, parseFloat(coupon.max_discount));
    } else {
      discount = parseFloat(coupon.value);
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: parseFloat(coupon.value),
        discount: Math.round(discount * 100) / 100,
        min_order_value: parseFloat(coupon.min_order_value),
      },
    });
  } catch (error) {
    console.error("ValidateCoupon Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { created_at: "desc" } });
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error("GetAllCoupons Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, min_order_value, max_discount, usage_limit, expires_at, is_active } = req.body;
    if (!code || !type || !value) return res.status(400).json({ success: false, error: "code, type, and value are required" });

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        min_order_value: parseFloat(min_order_value || 0),
        max_discount: max_discount ? parseFloat(max_discount) : null,
        usage_limit: usage_limit || null,
        expires_at: expires_at ? new Date(expires_at) : null,
        is_active: is_active !== false,
      },
    });
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    if (error.code === "P2002") return res.status(400).json({ success: false, error: "Coupon code already exists" });
    console.error("CreateCoupon Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const data = {};
    const fields = ["code", "type", "value", "min_order_value", "max_discount", "usage_limit", "expires_at", "is_active"];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (["value", "min_order_value", "max_discount"].includes(f)) data[f] = parseFloat(req.body[f]);
        else if (f === "usage_limit") data[f] = req.body[f] || null;
        else if (f === "expires_at") data[f] = req.body[f] ? new Date(req.body[f]) : null;
        else if (f === "is_active") data[f] = req.body[f];
        else data[f] = req.body[f];
      }
    }
    if (data.code) data.code = data.code.toUpperCase();

    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error("UpdateCoupon Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    console.error("DeleteCoupon Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
