import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import type { Repository } from "typeorm";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserService } from "../user.service.js";
import type { User } from "../user.entity.js";
import type { Session } from "../session.entity.js";
import type { RefreshToken } from "../token.entity.js";
import type { UpdateUser, UserRequest } from "../user.dto.js";
import { AppError } from "../../../utils/app.error.js";

vi.mock("bcrypt", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

vi.mock("jsonwebtoken", () => ({
  default: { sign: vi.fn() },
}));

type MockRepo = {
  findOneBy: Mock;
  findOne: Mock;
  find: Mock;
  create: Mock;
  save: Mock;
  delete: Mock;
};

const createMockRepo = (): MockRepo => ({
  findOneBy: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
});

/**
 * Awaits a promise that is expected to reject with an AppError
 * and asserts on its type and message.
 */
const expectAppError = async (promise: Promise<unknown>, message: string) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  expect((error as Error).message).toBe(message);
};

const sha256 = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const NOW = new Date("2026-01-01T00:00:00.000Z");
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Fixed output of the mocked crypto.randomBytes(32)
const RANDOM_HEX = "01".repeat(32);

// Factory so tests that mutate the user (e.g. lastLogin) do not leak state.
const makeUser = () =>
  ({
    id: "u1",
    email: "john@example.com",
    name: "John",
    password: "hashed-pw",
    lastLogin: null,
  }) as unknown as User;

describe("UserService", () => {
  let userRepo: MockRepo;
  let tokenRepo: MockRepo;
  let sessionRepo: MockRepo;
  let service: UserService;

  const hashMock = bcrypt.hash as unknown as Mock;
  const compareMock = bcrypt.compare as unknown as Mock;
  const signMock = jwt.sign as unknown as Mock;

  beforeEach(() => {
    userRepo = createMockRepo();
    tokenRepo = createMockRepo();
    sessionRepo = createMockRepo();

    service = new UserService(
      userRepo as unknown as Repository<User>,
      tokenRepo as unknown as Repository<RefreshToken>,
      sessionRepo as unknown as Repository<Session>,
    );

    hashMock.mockReset();
    compareMock.mockReset();
    signMock.mockReset();
    signMock.mockReturnValue("access-token");

    // Make token generation deterministic.
    (vi.spyOn(crypto, "randomBytes") as unknown as Mock).mockReturnValue(
      Buffer.alloc(32, 1),
    );

    // Only fake Date so promises and other timers behave normally.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);

    vi.stubEnv("JWT_SECRET_KEY", "test-secret");
    vi.stubEnv("JWT_EXPIRES_IN", "15m");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // ---------------------------------------------------------------------------
  describe("createUser", () => {
    const dto = {
      email: "john@example.com",
      name: "John",
      password: "plain-pw",
    } as unknown as UserRequest;

    it("throws a conflict error when the email is already taken", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());

      await expectAppError(
        service.createUser(dto),
        "this email has been taken",
      );

      expect(userRepo.findOneBy).toHaveBeenCalledWith({
        email: "john@example.com",
      });
      expect(hashMock).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("hashes the password, saves the user and omits the password from the result", async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      hashMock.mockResolvedValue("hashed-pw");
      userRepo.create.mockImplementation((u: unknown) => ({
        id: "u1",
        ...(u as object),
      }));
      userRepo.save.mockImplementation(async (u: unknown) => u);

      const result = await service.createUser(dto);

      expect(hashMock).toHaveBeenCalledWith("plain-pw", 10);
      expect(userRepo.create).toHaveBeenCalledWith({
        email: "john@example.com",
        name: "John",
        password: "hashed-pw",
      });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: "hashed-pw" }),
      );
      expect(result.data).toEqual({
        id: "u1",
        email: "john@example.com",
        name: "John",
      });
      expect(result.data).not.toHaveProperty("password");
    });
  });

  // ---------------------------------------------------------------------------
  describe("updateUser", () => {
    it("throws not found when the user does not exist", async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expectAppError(
        service.updateUser("404", { email: "new@example.com" } as UpdateUser),
        "user not found",
      );

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("throws a conflict error when the new email is already taken", async () => {
      userRepo.findOneBy
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce({ id: "u2", email: "new@example.com" });

      await expectAppError(
        service.updateUser("u1", { email: "new@example.com" } as UpdateUser),
        "this email has been taken",
      );

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("looks up the user by id and by the new email", async () => {
      userRepo.findOneBy
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(null);
      userRepo.save.mockImplementation(async (u: unknown) => u);

      await service.updateUser("u1", {
        email: "new@example.com",
      } as UpdateUser);

      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: "u1" });
      expect(userRepo.findOneBy).toHaveBeenCalledWith({
        email: "new@example.com",
      });
    });

    it("merges the update into the user and omits the password from the result", async () => {
      userRepo.findOneBy
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(null);
      userRepo.save.mockImplementation(async (u: unknown) => u);

      const result = await service.updateUser("u1", {
        name: "Jane",
        email: "new@example.com",
      } as UpdateUser);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "u1",
          name: "Jane",
          email: "new@example.com",
          password: "hashed-pw",
        }),
      );
      expect(result.data).toMatchObject({
        id: "u1",
        name: "Jane",
        email: "new@example.com",
      });
      expect(result.data).not.toHaveProperty("password");
    });
  });

  // ---------------------------------------------------------------------------
  describe("deleteUser", () => {
    it("throws not found when the user does not exist", async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expectAppError(service.deleteUser("404"), "user not found");

      expect(userRepo.delete).not.toHaveBeenCalled();
    });

    it("deletes the user by id", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      userRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteUser("u1");

      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: "u1" });
      expect(userRepo.delete).toHaveBeenCalledWith("u1");
      expect(result).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  describe("loginUser", () => {
    const login = () =>
      service.loginUser(
        "john@example.com",
        "plain-pw",
        "127.0.0.1",
        "Mozilla/5.0",
      );

    it("throws not found when no user has that email", async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expectAppError(login(), "user not found");

      expect(userRepo.findOneBy).toHaveBeenCalledWith({
        email: "john@example.com",
      });
      expect(compareMock).not.toHaveBeenCalled();
    });

    it("throws invalid credentials when the password does not match", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(false);

      await expectAppError(login(), "invalid credentials");

      expect(compareMock).toHaveBeenCalledWith("plain-pw", "hashed-pw");
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(signMock).not.toHaveBeenCalled();
      expect(tokenRepo.create).not.toHaveBeenCalled();
      expect(sessionRepo.create).not.toHaveBeenCalled();
    });

    it("updates lastLogin on the user", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(true);
      tokenRepo.create.mockReturnValue({ id: "t1" });
      sessionRepo.create.mockReturnValue({ id: "s1" });

      await login();

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "u1", lastLogin: NOW }),
      );
    });

    it("signs an access token with the configured secret and expiry", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(true);
      tokenRepo.create.mockReturnValue({ id: "t1" });
      sessionRepo.create.mockReturnValue({ id: "s1" });

      await login();

      expect(signMock).toHaveBeenCalledWith({ userId: "u1" }, "test-secret", {
        expiresIn: "15m",
      });
    });

    it("stores only the hashed refresh token, expiring in 7 days", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(true);
      tokenRepo.create.mockReturnValue({ id: "t1" });
      sessionRepo.create.mockReturnValue({ id: "s1" });

      await login();

      const expectedToken = {
        userId: "u1",
        refreshToken: sha256(RANDOM_HEX),
        expiredAt: new Date(NOW.getTime() + SEVEN_DAYS),
      };
      expect(tokenRepo.create).toHaveBeenCalledWith(expectedToken);
      expect(tokenRepo.save).toHaveBeenCalledWith({ id: "t1" });
    });

    it("creates a session linked to the refresh token with ip and user agent", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(true);
      tokenRepo.create.mockReturnValue({ id: "t1" });
      const session = { id: "s1" };
      sessionRepo.create.mockReturnValue(session);

      await login();

      expect(sessionRepo.create).toHaveBeenCalledWith({
        userId: "u1",
        refreshTokenId: "t1",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
      });
      expect(sessionRepo.save).toHaveBeenCalledWith(session);
    });

    it("returns the access token, the raw refresh token and the user without password", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(true);
      tokenRepo.create.mockReturnValue({ id: "t1" });
      sessionRepo.create.mockReturnValue({ id: "s1" });

      const result = await login();

      expect(result.accessToken).toBe("access-token");
      // The raw token goes to the client; only its hash is stored.
      expect(result.tokenRandomString).toBe(RANDOM_HEX);
      expect(result.tokenRandomString).not.toBe(sha256(RANDOM_HEX));
      expect(result.data).toEqual({
        id: "u1",
        email: "john@example.com",
        name: "John",
        lastLogin: NOW,
      });
      expect(result.data).not.toHaveProperty("password");
    });
  });

  // ---------------------------------------------------------------------------
  describe("refreshToken", () => {
    const makeToken = (overrides: Record<string, unknown> = {}) => ({
      id: "t1",
      userId: "u1",
      refreshToken: sha256("old-token"),
      expiredAt: new Date(NOW.getTime() + 60 * 1000),
      user: makeUser(),
      ...overrides,
    });

    it("looks up the token by its hash, including the user relation", async () => {
      tokenRepo.findOne.mockResolvedValue(makeToken());
      tokenRepo.save.mockResolvedValue(undefined);

      await service.refreshToken("old-token");

      expect(tokenRepo.findOne).toHaveBeenCalledWith({
        where: { refreshToken: sha256("old-token") },
        relations: { user: true },
      });
    });

    it("throws unauthorized when the token does not exist", async () => {
      tokenRepo.findOne.mockResolvedValue(null);

      await expectAppError(service.refreshToken("old-token"), "unauthorized");

      expect(tokenRepo.delete).not.toHaveBeenCalled();
      expect(signMock).not.toHaveBeenCalled();
    });

    it("deletes an expired token and throws unauthorized", async () => {
      tokenRepo.findOne.mockResolvedValue(
        makeToken({ expiredAt: new Date(NOW.getTime() - 1000) }),
      );

      await expectAppError(service.refreshToken("old-token"), "unauthorized");

      expect(tokenRepo.delete).toHaveBeenCalledWith("t1");
      expect(tokenRepo.save).not.toHaveBeenCalled();
      expect(signMock).not.toHaveBeenCalled();
    });

    it("throws not found when the token has no associated user", async () => {
      tokenRepo.findOne.mockResolvedValue(makeToken({ user: null }));

      await expectAppError(service.refreshToken("old-token"), "user not found");

      expect(tokenRepo.save).not.toHaveBeenCalled();
      expect(signMock).not.toHaveBeenCalled();
    });

    it("signs a new access token with the configured secret and expiry", async () => {
      tokenRepo.findOne.mockResolvedValue(makeToken());
      tokenRepo.save.mockResolvedValue(undefined);

      await service.refreshToken("old-token");

      expect(signMock).toHaveBeenCalledWith({ userId: "u1" }, "test-secret", {
        expiresIn: "15m",
      });
    });

    it("rotates the stored refresh token hash and extends the expiry by 7 days", async () => {
      const token = makeToken();
      const oldHash = token.refreshToken;
      tokenRepo.findOne.mockResolvedValue(token);
      tokenRepo.save.mockResolvedValue(undefined);

      await service.refreshToken("old-token");

      expect(tokenRepo.save).toHaveBeenCalledWith(token);
      expect(token.refreshToken).toBe(sha256(RANDOM_HEX));
      expect(token.refreshToken).not.toBe(oldHash);
      expect(token.expiredAt).toEqual(new Date(NOW.getTime() + SEVEN_DAYS));
      expect(token.userId).toBe("u1");
    });

    it("returns the new tokens and the user without password", async () => {
      tokenRepo.findOne.mockResolvedValue(makeToken());
      tokenRepo.save.mockResolvedValue(undefined);

      const result = await service.refreshToken("old-token");

      expect(result.accessToken).toBe("access-token");
      expect(result.tokenRandomString).toBe(RANDOM_HEX);
      expect(result.data).toEqual({
        id: "u1",
        email: "john@example.com",
        name: "John",
        lastLogin: null,
      });
      expect(result.data).not.toHaveProperty("password");
    });
  });

  // ---------------------------------------------------------------------------
  describe("logoutUser", () => {
    it("throws unauthorized when the token does not exist", async () => {
      tokenRepo.findOne.mockResolvedValue(null);

      await expectAppError(service.logoutUser("old-token"), "unauthorized");

      expect(tokenRepo.findOne).toHaveBeenCalledWith({
        where: { refreshToken: sha256("old-token") },
      });
      expect(tokenRepo.delete).not.toHaveBeenCalled();
    });

    it("deletes the token that matches the hashed refresh token", async () => {
      tokenRepo.findOne.mockResolvedValue({ id: "t1" });
      tokenRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.logoutUser("old-token");

      expect(tokenRepo.findOne).toHaveBeenCalledWith({
        where: { refreshToken: sha256("old-token") },
      });
      expect(tokenRepo.delete).toHaveBeenCalledWith("t1");
      expect(result).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  describe("findAllUser", () => {
    it("throws not found when there are no users", async () => {
      userRepo.find.mockResolvedValue([]);

      await expectAppError(service.findAllUser(), "user not found");
    });

    it("returns every user without the password field", async () => {
      userRepo.find.mockResolvedValue([
        { id: "u1", email: "a@example.com", password: "pw-a" },
        { id: "u2", email: "b@example.com", password: "pw-b" },
      ]);

      const result = await service.findAllUser();

      expect(result.data).toEqual([
        { id: "u1", email: "a@example.com" },
        { id: "u2", email: "b@example.com" },
      ]);
      result.data.forEach((user) =>
        expect(user).not.toHaveProperty("password"),
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe("findUserById", () => {
    it("throws not found when the user does not exist", async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expectAppError(service.findUserById("404"), "user not found");
    });

    it("returns the user without the password field", async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());

      const result = await service.findUserById("u1");

      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: "u1" });
      expect(result.data).toEqual({
        id: "u1",
        email: "john@example.com",
        name: "John",
        lastLogin: null,
      });
      expect(result.data).not.toHaveProperty("password");
    });
  });
});
