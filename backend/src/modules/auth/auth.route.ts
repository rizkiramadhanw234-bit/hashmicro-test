import { Router } from "express";
import { UserController } from "../user/user.controller.js";
import { UserService } from "../user/user.service.js";
import { AppDataSource } from "../../configs/db.js";
import { User } from "../user/user.entity.js";
import { Session } from "../user/session.entity.js";
import { RefreshToken } from "../user/token.entity.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createUserSchema } from "../user/user.validation.js";

const userService = new UserService(
  AppDataSource.getRepository(User),
  AppDataSource.getRepository(RefreshToken),
  AppDataSource.getRepository(Session),
);
const controller = new UserController(userService);

const router = Router();

router.post("/create", validateBody(createUserSchema), controller.createUser);
router.post("/login", controller.loginUser);
router.post("/logout", authMiddleware, controller.logoutUser);
router.post("/refresh-token", controller.refreshToken);

export default router;
