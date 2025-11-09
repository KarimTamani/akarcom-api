import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import config from "../../config/config";

const router = express.Router();

const projectRoot = path.join(__dirname, "../../../");
const uploadDir = path.join(projectRoot, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ---- Configure multer ----
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let subDir = "others";

    if (file.mimetype.startsWith("image/")) {
      subDir = "images";
    } else if (file.mimetype.startsWith("video/")) {
      subDir = "videos";
    } else if (file.mimetype === "application/pdf") {
      subDir = "pdfs";
    }

    const targetDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// ---- Allowed file types ----
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    // Images
    "image/jpeg",
    "image/png",
    "image/webp",

    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime", // .mov
    "video/webm",

    // PDFs
    "application/pdf",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPEG, PNG, WEBP images, MP4/MPEG/MOV/WEBM videos, and PDF documents are allowed"
      )
    );
  }

  cb(null, true);
};

// ---- Multer setup ----
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ---- Upload endpoint ----
router.post("/", upload.single("file"), (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  let type: "image" | "video" | "pdf" | "unknown" = "unknown";

  if (req.file.mimetype.startsWith("image/")) type = "image";
  else if (req.file.mimetype.startsWith("video/")) type = "video";
  else if (req.file.mimetype === "application/pdf") type = "pdf";

  const subDir =
    type === "image" ? "images" : type === "video" ? "videos" : type === "pdf" ? "pdfs" : "";

  const fileUrl = `${config.url}/uploads/${subDir}/${req.file.filename}`;

  res.json({
    message: "File uploaded successfully",
    type,
    fileUrl,
  });
});

export default router 
