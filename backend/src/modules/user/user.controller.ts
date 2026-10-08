import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { BaseController } from "../../utils/base.controller.js";
import type { UserRequest, UpdateUser } from "./user.dto.js";

export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const formBody = req.body as UserRequest;
      const { data } = await this.userService.createUser(formBody);
      res.status(201).json({ message: "user created", data });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const formBody = req.body as UpdateUser;
      const { data } = await this.userService.updateUser(id, formBody);
      res.status(200).json({ message: "user updated", data });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      await this.userService.deleteUser(id);
      res.status(200).json({ message: "user deleted" });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const { accessToken, tokenRandomString, data } =
        await this.userService.loginUser(
          email,
          password,
          req.ip as string,
          req.headers["user-agent"] as string,
        );

      res.cookie("refreshToken", tokenRandomString, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
      });
      res.status(200).json({ message: "user logged in", accessToken, data });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken as string;
      const { accessToken, tokenRandomString, data } =
        await this.userService.refreshToken(refreshToken);

      res.cookie("refreshToken", tokenRandomString, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
      });

      res.status(200).json({ message: "new refresh token", accessToken, data });
    } catch (error) {
      console.log(error);
      this.handleError(res, error);
    }
  };

  logoutUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken as string;
      await this.userService.logoutUser(refreshToken);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
      });
      res.status(200).json({ message: "user logged out" });
    } catch (error) {
      console.log(error);
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
      });
      this.handleError(res, error);
    }
  };

  findAllUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { data } = await this.userService.findAllUser();
      res.status(200).json({ message: "find all users", data });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  findUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { data } = await this.userService.findUserById(id);
      res.status(200).json({ message: "find user by id", data });
    } catch (error) {
      this.handleError(res, error);
    }
  };
}
