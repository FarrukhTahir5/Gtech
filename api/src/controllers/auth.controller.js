const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: "Email, password, and name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ success: false, error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password_hash: hashedPassword, name, phone, role: "customer" },
    });

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      success: true,
      data: { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ success: false, error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, error: "Invalid credentials" });

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

    res.json({
      success: true,
      data: { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, error: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ success: false, error: "Invalid refresh token" });

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid or expired refresh token" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, is_verified: true, created_at: true },
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("GetProfile Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, error: "Both passwords required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, error: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password_hash: hashedPassword } });
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("ChangePassword Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    res.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
    if (user) {
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }
  } catch (error) {
    console.error("ForgotPassword Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, error: "Token and new password required" });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: decoded.id }, data: { password_hash: hashedPassword } });
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ success: false, error: "Invalid or expired reset token" });
  }
};
