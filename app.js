import express from "express";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.routes.js";
import transactionRouter from "./routes/transaction.routes.js";

const app = express();

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/users", userRouter);
app.use("/api/v1/transactions", transactionRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Welcome to R4rupee Backend Server!" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

export default app;