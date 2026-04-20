const prisma = require("../lib/prisma");

// Create order — supports both COD and Stripe
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      payment_method = "cod",
      ship_name,
      ship_phone,
      ship_line1,
      ship_line2,
      ship_city,
      ship_province,
      ship_postal,
      notes,
      coupon_code,
      discount_amount = 0,
    } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: "No items in order" });
    }

    if (!ship_name || !ship_phone || !ship_line1 || !ship_city) {
      return res.status(400).json({ success: false, error: "Shipping details are required" });
    }

    // Validate coupon if provided
    let verifiedDiscount = 0;
    let validCoupon = null;

    if (coupon_code) {
      validCoupon = await prisma.coupon.findUnique({ where: { code: coupon_code } });
      if (!validCoupon || !validCoupon.is_active) {
        return res.status(400).json({ success: false, error: "Invalid or inactive coupon" });
      }
      if (validCoupon.expires_at && new Date(validCoupon.expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: "Coupon has expired" });
      }
      if (validCoupon.usage_limit && validCoupon.used_count >= validCoupon.usage_limit) {
        return res.status(400).json({ success: false, error: "Coupon usage limit reached" });
      }
    }

    // Validate stock and build order items
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { images: true },
      });

      if (!product) {
        return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}` });
      }

      const unitPrice = parseFloat(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItemsData.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku || null,
        product_image: product.images?.[0]?.url || null,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    // Server-side discount calculation for security
    if (validCoupon) {
      if (parseFloat(validCoupon.min_order_value) > subtotal) {
        return res.status(400).json({ success: false, error: "Minimum order value not met for coupon" });
      }

      if (validCoupon.type === "percentage") {
        verifiedDiscount = (subtotal * parseFloat(validCoupon.value)) / 100;
        if (validCoupon.max_discount) verifiedDiscount = Math.min(verifiedDiscount, parseFloat(validCoupon.max_discount));
      } else {
        verifiedDiscount = parseFloat(validCoupon.value);
      }
      
      // Allow for small rounding differences (1 Rs)
      if (Math.abs(verifiedDiscount - parseFloat(discount_amount)) > 1) {
        console.warn(`Discount mismatch: Provided: ${discount_amount}, Calculated: ${verifiedDiscount}`);
        // For safety, use the calculated one
      }
    }

    const totalAmount = Math.max(0, subtotal - verifiedDiscount);

    // Create order in a transaction (order + stock deduction + coupon usage)
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          order_number: `GT-${Date.now()}`,
          subtotal,
          discount_amount: verifiedDiscount,
          total_amount: totalAmount,
          coupon_code: coupon_code || null,
          status: payment_method === "cod" ? "confirmed" : "pending",
          payment_method,
          payment_status: "unpaid",
          ship_name,
          ship_phone,
          ship_line1,
          ship_line2: ship_line2 || null,
          ship_city,
          ship_province: ship_province || null,
          ship_postal: ship_postal || null,
          notes: notes || null,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // Update coupon usage
      if (coupon_code) {
        await tx.coupon.update({
          where: { code: coupon_code },
          data: { used_count: { increment: 1 } },
        });
      }

      // Deduct stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error("CreateOrder Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Get current user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { user_id: req.user.id },
      include: {
        items: {
          include: { product: { include: { images: true } } },
        },
      },
      orderBy: { created_at: "desc" },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("GetMyOrders Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order || (order.user_id !== req.user.id && req.user.role !== "admin")) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("GetOrderById Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
