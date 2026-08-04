import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";
import { User } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authentication error.",
      error: (error as Error).message,
    });
  }
};