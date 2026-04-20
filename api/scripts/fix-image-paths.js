const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:GillaniTech2024@db.emhahbugijqvhrpszvcw.supabase.co:5432/postgres';
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Starting image path cleanup...");

  try {
    const images = await prisma.productImage.findMany();
    let updatedCount = 0;

    for (const img of images) {
      // Check for absolute Windows paths (e.g., D:\...) or raw filenames without /api/uploads/
      if (img.url.includes('\\') || (img.url.includes('uploads') && !img.url.startsWith('/api/uploads/'))) {
        const parts = img.url.split(/[\\/]/);
        const filename = parts[parts.length - 1];
        const newUrl = `/api/uploads/${filename}`;
        
        console.log(`Fixing: ${img.url} -> ${newUrl}`);
        
        await prisma.productImage.update({
          where: { id: img.id },
          data: { url: newUrl }
        });
        updatedCount++;
      }
    }

    console.log(`Cleanup complete. Updated ${updatedCount} image records.`);
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
