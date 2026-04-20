const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Sentry = require("./lib/sentry");
const logger = require("./lib/logger");
const pinoHttp = require("pino-http");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const statsRoutes = require("./routes/stats.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const cartRoutes = require("./routes/cart.routes");
const reviewRoutes = require("./routes/review.routes");
const couponRoutes = require("./routes/coupon.routes");
const addressRoutes = require("./routes/address.routes");
const buybackRoutes = require("./routes/buyback.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const contactRoutes = require("./routes/contact.routes");

const app = express();

// Sentry request and tracing handlers — must be first middleware
app.use(Sentry.expressRequestHandler());
app.use(Sentry.expressTracingHandler());

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(pinoHttp({ logger }));

// Stripe webhook needs raw body — must come BEFORE express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const paymentController = require("./controllers/payment.controller");
    paymentController.stripeWebhook(req, res);
  }
);

// Global JSON Parser
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/buyback", buybackRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/contact", contactRoutes);

// Static files (Images)
app.use("/api/uploads", express.static("uploads"));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Gillani Tech API", status: "active" });
});

// Sentry error handler
app.use(Sentry.expressErrorHandler());

// Global error handler — catches JSON parse errors, multer errors, etc.
// Must have 4 params so Express treats it as an error handler
app.use((err, req, res, next) => {
  // JSON body-parser syntax errors
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, error: "Invalid JSON in request body" });
  }
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ success: false, error: err.message || "Internal Server Error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not Found" });
});

module.exports = app;
