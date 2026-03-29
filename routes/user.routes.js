import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/register", registerUser);
router.post("/login", loginUser);

// ── Protected routes (require valid JWT) ──────────────────────────────────────
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getMe);

export default router;