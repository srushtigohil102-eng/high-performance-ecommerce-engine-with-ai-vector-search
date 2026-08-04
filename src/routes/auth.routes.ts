import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  changePassword,
} from "../controllers/auth.controller";
// Attempt to load the authenticate middleware from possible filenames.
// Some setups name the file auth.middleware.ts or auth.ts; try both via require.
let authenticate: any;
try {
  authenticate = require("../middleware/auth.middleware").authenticate;
} catch (e) {
  try {
    authenticate = require("../middleware/auth").authenticate;
  } catch (e) {
    // If neither import works, throw the original error to surface the issue.
    throw e;
  }
}
// Attempt to load requireAdmin middleware from possible filenames.
// Some setups name the file role.middleware.ts or role.ts; try both via require.
let requireAdmin: any;
try {
  requireAdmin = require("../middleware/role.middleware").requireAdmin;
} catch (e) {
  try {
    requireAdmin = require("../middleware/role").requireAdmin;
  } catch (e) {
    // If neither import works, throw the original error to surface the issue.
    throw e;
  }
}

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authenticate, getCurrentUser);
router.put("/change-password", authenticate, changePassword);

// Admin only routes
router.get("/admin/users", authenticate, requireAdmin, async (_req, res) => {
  const User = require("../models/User").User;
  const users = await User.find().select("-password");
  res.json({ success: true, data: users });
});

export default router;