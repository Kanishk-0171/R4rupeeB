import { Readable } from "stream";
import csv from "csv-parser";
import { Transaction } from "../models/transaction.models.js";
import { Category } from "../models/category.models.js";
import { Account } from "../models/account.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Shared helper: resolve category by name ───────────────────────────────────
// Looks up the category by name (case-insensitive) for this user.
// Returns the category doc or null if not found.
const resolveCategory = async (categoryName, userId) => {
  return Category.findOne({
    user: userId,
    name: { $regex: new RegExp(`^${categoryName.trim()}$`, "i") },
  });
};

// ── Shared helper: resolve account ────────────────────────────────────────────
// Gets the user's first active account. In a real app you'd pass accountId
// from the request; this keeps the API simple for now.
const resolveAccount = async (userId) => {
  return Account.findOne({ user: userId, isActive: true });
};

// ── Shared helper: validate a single transaction row ─────────────────────────
const validateRow = ({ name, category, date, amount, type }) => {
  const errors = [];

  if (!name || !String(name).trim()) errors.push("name is required");
  if (!category || !String(category).trim()) errors.push("category is required");
  if (!date || isNaN(new Date(date))) errors.push("date is invalid");
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    errors.push("amount must be a positive number");
  if (!type || !["income", "expense", "transfer"].includes(String(type).toLowerCase()))
    errors.push("type must be income, expense, or transfer");

  return errors;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/transactions/add
// Body: { name, category, date, amount, type, note?, paymentMethod?, status? }
// ─────────────────────────────────────────────────────────────────────────────
const addTransaction = asyncHandler(async (req, res) => {
  const { name, category: categoryName, date, amount, type, note, paymentMethod, status } =
    req.body;

  // 1. Validate required fields
  const errors = validateRow({ name, category: categoryName, date, amount, type });
  if (errors.length) {
    throw new ApiError(400, `Validation failed: ${errors.join(", ")}`);
  }

  // 2. Resolve category
  const categoryDoc = await resolveCategory(categoryName, req.user._id);
  if (!categoryDoc) {
    throw new ApiError(404, `Category "${categoryName}" not found. Please create it first.`);
  }

  // 3. Resolve account
  const accountDoc = await resolveAccount(req.user._id);
  if (!accountDoc) {
    throw new ApiError(404, "No active account found. Please create an account first.");
  }

  // 4. Save transaction
  const transaction = await Transaction.create({
    user: req.user._id,
    account: accountDoc._id,
    category: categoryDoc._id,
    name: name.trim(),
    amount: Number(amount),
    type: type.toLowerCase(),
    date: new Date(date),
    note: note?.trim() || undefined,
    paymentMethod: paymentMethod || "other",
    status: status || "completed",
  });

  // 5. Update account balance
  const balanceDelta =
    type.toLowerCase() === "income" ? Number(amount) : -Number(amount);
  await Account.findByIdAndUpdate(accountDoc._id, {
    $inc: { balance: balanceDelta },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, transaction, "Transaction added successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/transactions/upload
// Multipart form-data: file field = "file" (CSV)
// CSV columns: name, category, date, amount, type
// ─────────────────────────────────────────────────────────────────────────────
const uploadTransactions = asyncHandler(async (req, res) => {
  // 1. Ensure file was attached by multer
  if (!req.file) {
    throw new ApiError(400, "No CSV file uploaded. Attach the file under the key 'file'.");
  }

  // 2. Resolve the user's default account once (used for all rows)
  const accountDoc = await resolveAccount(req.user._id);
  if (!accountDoc) {
    throw new ApiError(404, "No active account found. Please create an account first.");
  }

  // 3. Parse CSV from the in-memory buffer (multer memoryStorage)
  const rows = await new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(req.file.buffer);
    stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });

  if (!rows.length) {
    throw new ApiError(400, "The CSV file is empty.");
  }

  // 4. Process each row: validate → resolve category → build transaction doc
  const saved = [];
  const skipped = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // row 1 = header

    // 4a. Field-level validation
    const errors = validateRow(row);
    if (errors.length) {
      skipped.push({ row: rowNum, reason: errors.join(", "), data: row });
      continue;
    }

    // 4b. Resolve category
    const categoryDoc = await resolveCategory(row.category, req.user._id);
    if (!categoryDoc) {
      skipped.push({
        row: rowNum,
        reason: `Category "${row.category}" not found`,
        data: row,
      });
      continue;
    }

    saved.push({
      user: req.user._id,
      account: accountDoc._id,
      category: categoryDoc._id,
      name: String(row.name).trim(),
      amount: Number(row.amount),
      type: String(row.type).toLowerCase(),
      date: new Date(row.date),
      status: "completed",
    });
  }

  // 5. Bulk insert all valid rows in one DB call
  let inserted = [];
  if (saved.length) {
    inserted = await Transaction.insertMany(saved, { ordered: false });

    // 6. Recalculate and update account balance from inserted transactions
    const balanceDelta = inserted.reduce((sum, t) => {
      return sum + (t.type === "income" ? t.amount : -t.amount);
    }, 0);

    await Account.findByIdAndUpdate(accountDoc._id, {
      $inc: { balance: balanceDelta },
    });
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        totalRows: rows.length,
        savedCount: inserted.length,
        skippedCount: skipped.length,
        skipped, // tells the client exactly which rows failed and why
      },
      `${inserted.length} transaction(s) saved, ${skipped.length} skipped.`
    )
  );
});

export { addTransaction, uploadTransactions };