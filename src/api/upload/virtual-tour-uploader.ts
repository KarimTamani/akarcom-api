import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import unzipper from "unzipper"; // for ZIP files
import config from "../../config/config";
import Unrar from "node-unrar";
import { exec } from "child_process";
const router = express.Router();

const projectRoot = path.join(__dirname, "../../../");
const uploadDir = path.join(projectRoot, "uploads", "virtual_tours");


function findIndexFileRelative(baseDir: string, currentDir: string = baseDir): string | null {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isFile()) {
      const baseName = path.parse(entry.name).name.toLowerCase();
      if (baseName === "index") {
        return path.relative(baseDir, fullPath).replace(/\\/g, "/"); // Windows-safe
      }
    } else if (entry.isDirectory()) {
      const found = findIndexFileRelative(baseDir, fullPath);
      if (found) return found;
    }
  }

  return null; // Not found
}


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ---- Multer storage ----
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    const baseName = path.basename(file.originalname, ext);
    const uniqueName = `${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// ---- Allowed compressed file types ----
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-tar",
    "application/octet-stream"

  ];
  console.log(file.mimetype)
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

function runUnrar(compressedFilePath: string, extractDir: string) {
  return new Promise<void>((resolve, reject) => {
    exec(`"unrar" x "${compressedFilePath}" "${extractDir}/" -y`, { maxBuffer: 1024 * 1024 * 100 }, (err, stdout, stderr) => {
      if (err) return reject(err);
       resolve();
    });
  });
}

// ---- POST endpoint ----
router.post("/", upload.single("file"), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const compressedFilePath = req.file.path;
  const ext = path.extname(req.file.filename).toLowerCase();
  const folderName = path.basename(req.file.filename, ext).replace(/[\s\(\)]/g, "_");
  const extractDir = path.join(uploadDir, folderName);

  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  console.log(compressedFilePath)
  try {
    console.log(ext);

    if (ext === ".zip") {
      // ZIP extraction
      await fs
        .createReadStream(compressedFilePath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

    } else if (ext === ".rar") {

      await runUnrar(compressedFilePath, extractDir)



    } else {
      return res
        .status(400)
        .json({ error: "Only ZIP and RAR files are supported" });
    }

    // Remove uploaded file after extraction
    fs.unlinkSync(compressedFilePath);
    let fileUrl: string = `${config.url}/uploads/virtual_tours/${folderName}/`;

    const basePath = path.join("uploads", "virtual_tours", folderName);

    const relativeIndexPath = findIndexFileRelative(basePath);

    fileUrl += relativeIndexPath

    res.json({
      message: "Compressed file uploaded and extracted successfully",
      fileUrl ,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to extract compressed file" });
  }
});
export default router;



