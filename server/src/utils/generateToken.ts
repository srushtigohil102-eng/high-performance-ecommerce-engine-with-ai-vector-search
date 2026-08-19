import jwt from "jsonwebtoken";

export const generateToken = (
  _id: string,
  email: string,
  role: "customer" | "admin",
  emailVerified: boolean
): string => {
  return jwt.sign({ _id, email, role, emailVerified }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};
