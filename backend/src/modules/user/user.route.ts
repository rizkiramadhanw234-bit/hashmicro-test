import { Router } from "express";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { AppDataSource } from "../../configs/db.js";
import { User } from "./user.entity.js";
import { Session } from "./session.entity.js";
import { RefreshToken } from "./token.entity.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const userService = new UserService(
  AppDataSource.getRepository(User),
  AppDataSource.getRepository(RefreshToken),
  AppDataSource.getRepository(Session),
);
const controller = new UserController(userService);

const router = Router();

router.get("/", authMiddleware, controller.findAllUser);
router.get("/:id", authMiddleware, controller.findUserById);
router.put("/:id", authMiddleware, controller.updateUser);
router.delete("/:id", authMiddleware, controller.deleteUser);

export default router;
