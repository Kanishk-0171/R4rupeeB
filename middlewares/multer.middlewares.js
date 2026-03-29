import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// Store file in memory (no disk write) — we parse the buffer directly in the controller
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only CSV files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});