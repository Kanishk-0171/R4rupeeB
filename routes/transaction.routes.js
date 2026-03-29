import { Router } from "express";
import { addTransaction, uploadTransactions } from "../controllers/transaction.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

// All transaction routes are protected
router.use(verifyJWT);

// POST /api/v1/transactions/add
// Body (JSON): { name, category, date, amount, type, note?, paymentMethod? }
router.post("/add", addTransaction);

// POST /api/v1/transactions/upload
// Form-data: file (CSV with columns: name, category, date, amount, type)
router.post("/upload", upload.single("file"), uploadTransactions);

export default router;