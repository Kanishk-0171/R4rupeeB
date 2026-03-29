import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//   Cookie options 
const cookieOptions = {
  httpOnly: true,  // not accessible via JS on the client
  // secure: process.env.NODE_ENV === "production",
  secure: false
};

// ── Helper: generate both tokens and save refreshToken to DB 
const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ── POST /api/v1/users/register 
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, currency, timezone } = req.body;

  // 1. Basic field validation
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  // 2. Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // 3. Create user (password stored as plain text — swap for bcrypt in future updates)
  const user = await User.create({
    name,
    email,
    password,
    currency: currency || "USD",
    timezone: timezone || "UTC",
  });

  // 4. Return user without sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// ── POST /api/v1/users/login ───
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Need password back for comparison — it's select:false by default
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Plain-text comparison (no bcrypt)
  if (user.password !== password) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Login successful"
      )
    );
});

// ── POST /api/v1/users/logout ──
const logoutUser = asyncHandler(async (req, res) => {
  // req.user is set by the auth middleware
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ── GET /api/v1/users/me ───────
const getMe = asyncHandler(async (req, res) => {
  // req.user is injected by auth middleware after token verification
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export { registerUser, loginUser, logoutUser, getMe };