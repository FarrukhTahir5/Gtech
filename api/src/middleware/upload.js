const multer = require("multer");
const path = require("path");
const fs = require("fs");

let upload;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  // Use Cloudinary storage when credentials are present
  const cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "gillani-tech-products",
      allowed_formats: ["jpg", "png", "webp"],
    },
  });

  upload = multer({ storage: storage });
} else {
  // Fallback to local disk storage when Cloudinary is not configured
  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp/;
      const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
      const mimeOk = allowed.test(file.mimetype);
      cb(null, extOk && mimeOk);
    },
  });
}

module.exports = upload;
