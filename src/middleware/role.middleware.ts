import { Request, Response, NextFunction } from "express";

type UserRole = "admin" | "user";

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized. Required: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole("admin");
export const requireUser = requireRole("admin", "user");