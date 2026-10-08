import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import { dbConnection } from "./configs/db.js";
import productsRoute from "./modules/product/product.route.js";
import usersRoute from "./modules/user/user.route.js";
import authRoute from "./modules/auth/auth.route.js";

dotenv.config();
dbConnection();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome!");
});

app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/products", productsRoute);

app.use((_req: Request, res: Response) => {
  return res.status(404).json({ message: "route not found!" });
});

export default app;
