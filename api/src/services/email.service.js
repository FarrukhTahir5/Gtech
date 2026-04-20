const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email] Skipped (no SMTP config): ${subject} → ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || `"Gillani Tech" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent: ${subject} → ${to}`);
  } catch (error) {
    console.error("[Email] Send failed:", error.message);
  }
}

// Templates
function orderConfirmation(order) {
  return {
    subject: `Order ${order.order_number} Confirmed — Gillani Tech`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0040a1; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Gillani Tech</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <h2>Order Confirmed!</h2>
          <p>Thank you for your order. Your order number is <strong>${order.order_number}</strong>.</p>
          <p>Total: <strong>Rs. ${order.total_amount}</strong></p>
          <p>Payment: ${order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
          <p>Shipping to: ${order.ship_name}, ${order.ship_city}</p>
          <hr style="margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">Gillani Tech — Premium Printers & Computer Accessories</p>
        </div>
      </div>
    `,
  };
}

function orderStatusUpdate(order) {
  return {
    subject: `Order ${order.order_number} — ${order.status.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0040a1; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Gillani Tech</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <h2>Order Status Update</h2>
          <p>Your order <strong>${order.order_number}</strong> has been updated to:</p>
          <p style="font-size: 20px; font-weight: bold; color: #0040a1;">${order.status.toUpperCase()}</p>
          ${order.tracking_number ? `<p>Tracking: <strong>${order.tracking_number}</strong> (${order.courier || "N/A"})</p>` : ""}
          <hr style="margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">Gillani Tech — Premium Printers & Computer Accessories</p>
        </div>
      </div>
    `,
  };
}

function passwordReset(user, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  return {
    subject: "Reset Your Password — Gillani Tech",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0040a1; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Gillani Tech</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <h2>Password Reset</h2>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #0040a1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  };
}

module.exports = { sendEmail, orderConfirmation, orderStatusUpdate, passwordReset };
