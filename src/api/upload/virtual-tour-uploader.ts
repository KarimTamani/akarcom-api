import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import unzipper from "unzipper"; // for ZIP files
import config from "../../config/config";

const router = express.Router();

const projectRoot = path.join(__dirname, "../../../");
const uploadDir = path.join(projectRoot, "uploads", "virtual_tours");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ---- Multer storage ----
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// ---- Allowed compressed file types ----
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-tar",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only compressed files are allowed (zip, rar, 7z, tar.gz)"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB max
});

// ---- POST endpoint ----


// ---- POST endpoint ----
router.post("/", upload.single("file"), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const compressedFilePath = req.file.path;
  const ext = path.extname(req.file.filename);
  const folderName = path.basename(req.file.filename, ext);
  const extractDir = path.join(uploadDir, folderName);

  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  try {
    // Only handle ZIP for now
    if (ext === ".zip") {
      await fs
        .createReadStream(compressedFilePath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();
    } else {
      return res.status(400).json({ error: "Currently only ZIP files are supported for extraction" });
    }

    // Delete original compressed file
    fs.unlinkSync(compressedFilePath);

    // Return the public URL to the extracted folder
    const fileUrl = `${config.url}/uploads/virtual_tours/${folderName}/`;

    res.json({
      message: "Compressed file uploaded and extracted successfully",
      fileUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to extract compressed file" });
  }
});
export default router;
