import { Response } from "express";
import { User, IUserAddress } from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import type { AuditAction } from "../models/AuditLog";
import {
  generateAuthToken,
  hashToken,
  EMAIL_VERIFY_TTL_MS,
  getClientUrl,
} from "../utils/tokens";
import { sendEmailVerificationEmail } from "../services/emailService";
import { logAudit } from "../utils/audit";

const REFRESH_COOKIE_NAME = "refreshToken";

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
  });
};

// Shape a saved-address subdocument for the client: id instead of _id, and all
// fields present so the frontend can bind directly to the response.
const toAddressJSON = (addr: IUserAddress) => ({
  id: addr._id.toString(),
  label: addr.label,
  fullName: addr.fullName,
  addressLine1: addr.addressLine1,
  addressLine2: addr.addressLine2 ?? "",
  city: addr.city,
  state: addr.state,
  postalCode: addr.postalCode,
  phone: addr.phone ?? "",
  isDefault: Boolean(addr.isDefault),
});

const auditUserAction = (
  req: AuthRequest,
  action: AuditAction,
  details: Record<string, unknown>
): void => {
  void logAudit({
    action,
    resource: "user",
    resourceId: req.user?._id,
    details,
    actor: req.user?._id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
};

// GET /api/users/me — current user's full profile
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/users/me — update name / email. Changing the email flips the account
// back to unverified and sends a fresh verification link to the new address,
// reusing the existing email-verification flow.
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { name, email } = req.body;
    const changed: string[] = [];

    if (typeof name === "string" && name.trim() && name !== user.name) {
      user.name = name.trim();
      changed.push("name");
    }

    if (typeof email === "string" && email.trim() && email !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing && existing._id.toString() !== user._id.toString()) {
        res.status(400).json({ message: "Email is already in use" });
        return;
      }

      // Email change requires re-verification — reset to unverified and issue a
      // fresh token for the new address.
      user.email = normalizedEmail;
      user.emailVerified = false;
      const verificationToken = generateAuthToken();
      user.emailVerificationToken = hashToken(verificationToken);
      user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
      changed.push("email");
      void sendEmailVerificationEmail(
        user,
        `${getClientUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`
      );
    }

    if (changed.length === 0) {
      res.json(user);
      return;
    }

    await user.save();
    auditUserAction(req, "user.profile_updated", { fields: changed });

    res.json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/users/me/password — change password with the current password check.
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }

    if (newPassword === currentPassword) {
      res.status(400).json({ message: "New password must be different from the current password" });
      return;
    }

    user.password = newPassword;
    // Revoke all sessions: the current refresh token and any others are gone,
    // so the user must sign in again with the new password.
    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    await user.save();
    clearRefreshTokenCookie(res);

    auditUserAction(req, "user.password_changed", {});

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/users/me/addresses
export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select("addresses");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user.addresses.map(toAddressJSON));
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/users/me/addresses
export const addAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const data = req.body as Partial<IUserAddress>;
    const isDefault = Boolean(data.isDefault);

    if (isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    } else if (user.addresses.length === 0) {
      // First saved address becomes the default automatically.
      data.isDefault = true;
    }

    const address = user.addresses.create({
      label: data.label,
      fullName: data.fullName,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || undefined,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      phone: data.phone || undefined,
      isDefault: Boolean(data.isDefault),
    });

    user.addresses.push(address);
    await user.save();

    auditUserAction(req, "user.address_added", { label: address.label });

    res.status(201).json(toAddressJSON(address as unknown as IUserAddress));
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/users/me/addresses/:addressId
export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const addressId = String(req.params.addressId);
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const data = req.body as Partial<IUserAddress>;
    if (data.label !== undefined) address.label = data.label;
    if (data.fullName !== undefined) address.fullName = data.fullName;
    if (data.addressLine1 !== undefined) address.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined) address.addressLine2 = data.addressLine2 || undefined;
    if (data.city !== undefined) address.city = data.city;
    if (data.state !== undefined) address.state = data.state;
    if (data.postalCode !== undefined) address.postalCode = data.postalCode;
    if (data.phone !== undefined) address.phone = data.phone || undefined;

    if (typeof data.isDefault === "boolean") {
      if (data.isDefault) {
        user.addresses.forEach((a) => (a.isDefault = false));
      }
      address.isDefault = data.isDefault;
      if (data.isDefault === false && user.addresses.length > 0) {
        const hasDefault = user.addresses.some((a) => a.isDefault);
        if (!hasDefault) user.addresses[0].isDefault = true;
      }
    }

    await user.save();

    auditUserAction(req, "user.address_updated", { label: address.label });

    res.json(toAddressJSON(address as unknown as IUserAddress));
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/users/me/addresses/:addressId
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const addressId = String(req.params.addressId);
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const wasDefault = Boolean(address.isDefault);
    user.addresses.pull(addressId);

    // If the default was removed, promote the first remaining address.
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    auditUserAction(req, "user.address_deleted", { addressId });

    res.json({ message: "Address deleted" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
