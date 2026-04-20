const prisma = require("../lib/prisma");

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: req.user.id },
      orderBy: { is_default: "desc" },
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error("GetAddresses Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { label, full_name, phone, line1, line2, city, province, postal_code, country } = req.body;
    if (!full_name || !phone || !line1 || !city) {
      return res.status(400).json({ success: false, error: "full_name, phone, line1, and city are required" });
    }

    // If this is first address, set as default
    const count = await prisma.address.count({ where: { user_id: req.user.id } });

    const address = await prisma.address.create({
      data: {
        user_id: req.user.id,
        label: label || null,
        full_name,
        phone,
        line1,
        line2: line2 || null,
        city,
        province: province || null,
        postal_code: postal_code || null,
        country: country || "Pakistan",
        is_default: count === 0,
      },
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    console.error("AddAddress Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: "Address not found" });
    }

    const fields = ["label", "full_name", "phone", "line1", "line2", "city", "province", "postal_code", "country"];
    const data = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }

    const address = await prisma.address.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: address });
  } catch (error) {
    console.error("UpdateAddress Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: "Address not found" });
    }

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("DeleteAddress Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.setDefault = async (req, res) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: "Address not found" });
    }

    await prisma.$transaction([
      prisma.address.updateMany({ where: { user_id: req.user.id }, data: { is_default: false } }),
      prisma.address.update({ where: { id: req.params.id }, data: { is_default: true } }),
    ]);

    res.json({ success: true, message: "Default address updated" });
  } catch (error) {
    console.error("SetDefaultAddress Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
