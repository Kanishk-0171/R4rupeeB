import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // Token can come from cookie OR Authorization header (Bearer <token>)
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized — no token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Unauthorized — invalid or expired token");
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized — user not found");
  }

  req.user = user;
  next();
});