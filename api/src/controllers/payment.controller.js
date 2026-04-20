const prisma = require("../lib/prisma");

// Lazy-init Stripe to avoid crash when key is empty
let stripe = null;
function getStripe() {
  if (!stripe) {
    const Stripe = require("stripe");
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in .env");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

exports.createCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { include: { images: true } } } } },
    });

    if (!order || order.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "pkr",
        product_data: {
          name: item.product_name,
          images: item.product_image ? [item.product_image] : [],
        },
        unit_amount: Math.round(parseFloat(item.unit_price) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/checkout/success?orderId=${orderId}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${orderId}`,
      customer_email: req.user.email,
      line_items: lineItems,
      metadata: { orderId },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ success: false, error: error.message || "Payment initiation failed" });
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook Signature Error:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_status: "paid",
        status: "processing",
        payment_ref: session.payment_intent, // Bug 5 fix: was "payment_intent_id"
      },
    });
  }

  res.json({ received: true });
};
