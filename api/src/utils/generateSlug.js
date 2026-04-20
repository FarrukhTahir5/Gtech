function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 220);
}

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `GT-${date}-${random}`;
}

module.exports = { generateSlug, generateOrderNumber };
