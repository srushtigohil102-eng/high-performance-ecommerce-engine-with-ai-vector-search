import { Router } from "express";
import {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  updateProfileValidation,
  changePasswordValidation,
  addressValidation,
  addressIdParamValidation,
} from "../middleware/validate";

const router = Router();

// Every /api/users route requires an authenticated user.
router.use(authMiddleware);

// GET /api/users/me — current user's profile
router.get("/me", getMe);

// PUT /api/users/me — update name / email (email change requires re-verification)
router.put("/me", updateProfileValidation, updateMe);

// PUT /api/users/me/password — change password (current password required)
router.put("/me/password", changePasswordValidation, changePassword);

// Saved-address book
router.get("/me/addresses", getAddresses);
router.post("/me/addresses", addressValidation, addAddress);
router.put("/me/addresses/:addressId", addressIdParamValidation, addressValidation, updateAddress);
router.delete("/me/addresses/:addressId", addressIdParamValidation, deleteAddress);

export default router;
