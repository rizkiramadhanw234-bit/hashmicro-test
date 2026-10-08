import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (typeof decoded === "string")
      return res.status(400).json({ message: "Invalid token" });

    req.user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
}
