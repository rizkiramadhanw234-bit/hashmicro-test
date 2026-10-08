import type { Response } from "express";
import { AppError } from "./app.error.js";

export abstract class BaseController {
  protected handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: "internal server error" });
    }
  }
}
