import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_this";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};