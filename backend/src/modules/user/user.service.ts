import { User } from "./user.entity.js";
import { Session } from "./session.entity.js";
import { RefreshToken } from "./token.entity.js";
import { Repository } from "typeorm";
import { AppError, HTTP_STATUS } from "../../utils/app.error.js";
import type { UserRequest, UpdateUser } from "./user.dto.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { StringValue } from "ms";
import crypto from "crypto";

export class UserService {
  constructor(
    private readonly userRepo: Repository<User>,
    private readonly tokenRepo: Repository<RefreshToken>,
    private readonly sessionRepo: Repository<Session>,
  ) {}

  createUser = async (data: UserRequest) => {
    const emailExist = await this.userRepo.findOneBy({ email: data.email });
    if (emailExist) {
      throw new AppError("this email has been taken", HTTP_STATUS.CONFLICT);
    }

    const hashedPass = await bcrypt.hash(data.password, 10);
    const newUser = this.userRepo.create({
      ...data,
      password: hashedPass,
    });
    await this.userRepo.save(newUser);

    const { password: _, ...dataUser } = newUser;
    return { data: dataUser };
  };

  updateUser = async (id: string, data: UpdateUser) => {
    const [user, emailExist] = await Promise.all([
      this.userRepo.findOneBy({ id }),
      this.userRepo.findOneBy({ email: data.email }),
    ]);
    if (!user) {
      throw new AppError("user not found", HTTP_STATUS.NOT_FOUND);
    }
    if (emailExist) {
      throw new AppError("this email has been taken", HTTP_STATUS.CONFLICT);
    }

    const updatedUser = await this.userRepo.save({
      ...user,
      ...data,
    });

    const { password: _, ...dataUser } = updatedUser;
    return { data: dataUser };
  };

  deleteUser = async (id: string) => {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new AppError("user not found", HTTP_STATUS.NOT_FOUND);
    }
    await this.userRepo.delete(id);
    return;
  };

  loginUser = async (
    email: string,
    password: string,
    ipAdress: string,
    userAgent: string,
  ) => {
    const user = await this.userRepo.findOneBy({ email: email });
    if (!user) {
      throw new AppError("user not found", HTTP_STATUS.NOT_FOUND);
    }

    const isValidPass = await bcrypt.compare(password, user.password);
    if (!isValidPass) {
      throw new AppError("invalid credentials", HTTP_STATUS.BAD_REQUEST);
    }
    user.lastLogin = new Date();
    await this.userRepo.save(user);

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN as StringValue },
    );

    const tokenRandomString = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(tokenRandomString)
      .digest("hex");
    const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const token = this.tokenRepo.create({
      userId: user.id,
      refreshToken: hashedToken,
      expiredAt: expiredAt,
    });
    await this.tokenRepo.save(token);

    const session = this.sessionRepo.create({
      userId: user.id,
      refreshTokenId: token.id,
      ipAddress: ipAdress,
      userAgent: userAgent,
    });
    await this.sessionRepo.save(session);

    const { password: _, ...dataUser } = user;
    return { accessToken, tokenRandomString, data: dataUser };
  };

  refreshToken = async (refreshToken: string) => {
    if (!refreshToken) {
      throw new AppError("unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
    const hashedToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const token = await this.tokenRepo.findOne({
      where: { refreshToken: hashedToken },
      relations: { user: true },
    });
    if (!token) {
      throw new AppError("unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    if (token.expiredAt < new Date()) {
      await this.tokenRepo.delete(token.id);
      throw new AppError("unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = token.user;
    if (!user) {
      throw new AppError("user not found", HTTP_STATUS.NOT_FOUND);
    }
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN as StringValue },
    );

    const tokenRandomString = crypto.randomBytes(32).toString("hex");
    const newHashedToken = crypto
      .createHash("sha256")
      .update(tokenRandomString)
      .digest("hex");
    const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    token.userId = user.id;
    token.refreshToken = newHashedToken;
    token.expiredAt = expiredAt;
    await this.tokenRepo.save(token);

    const { password: _, ...dataUser } = user;
    return { accessToken, tokenRandomString, data: dataUser };
  };

  logoutUser = async (refreshToken: string) => {
    const token = await this.tokenRepo.findOne({
      where: { refreshToken },
    });
    if (!token) {
      throw new AppError("unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
    await this.tokenRepo.delete(token.id);
    return;
  };

  findAllUser = async () => {
    const users = await this.userRepo.find();
    if (users.length === 0) {
      throw new AppError("user not found", HTTP_STATUS.NOT_FOUND);
    }
    const dataUsers = users.map(({ password: _, ...user }) => user);
    return { data: dataUsers };
  };

  findUserById = async (id: string) => {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new AppError("user not found", HTTP_STATUS.NOT_FOUND);
    }
    const { password: _, ...dataUser } = user;
    return { data: dataUser };
  };
}
