require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/lib/prisma");

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@gillanitech.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const name = process.env.ADMIN_NAME || "Admin";

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin user already exists: ${email}. Updating password and role.`);
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({ 
        where: { email }, 
        data: { role: "admin", password_hash: hashedPassword } 
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password_hash: hashedPassword, name, role: "admin" },
    });
    console.log(`Admin user created: ${email}`);
    console.log(`Password: ${password}`);
    console.log("Please change the password after first login.");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
