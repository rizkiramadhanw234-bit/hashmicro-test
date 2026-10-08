import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { UserController } from "../user.controller.js";
import type { UserService } from "../user.service.js";
import type { UpdateUser, UserRequest } from "../user.dto.js";

type MockService = {
  createUser: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
  deleteUser: ReturnType<typeof vi.fn>;
  loginUser: ReturnType<typeof vi.fn>;
  refreshToken: ReturnType<typeof vi.fn>;
  logoutUser: ReturnType<typeof vi.fn>;
  findAllUser: ReturnType<typeof vi.fn>;
  findUserById: ReturnType<typeof vi.fn>;
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const createMockResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };
};

const createMockRequest = (overrides: Record<string, unknown> = {}): Request =>
  ({
    body: {},
    params: {},
    query: {},
    cookies: {},
    headers: {},
    ...overrides,
  }) as unknown as Request;

describe("UserController", () => {
  let service: MockService;
  let controller: UserController;
  let handleErrorSpy: ReturnType<typeof vi.fn>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    service = {
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      loginUser: vi.fn(),
      refreshToken: vi.fn(),
      logoutUser: vi.fn(),
      findAllUser: vi.fn(),
      findUserById: vi.fn(),
    };

    controller = new UserController(service as unknown as UserService);

    handleErrorSpy = vi.fn();
    (controller as unknown as { handleError: unknown }).handleError =
      handleErrorSpy;

    res = createMockResponse();

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("createUser", () => {
    it("creates a user and returns 201", async () => {
      const body = { email: "rizki@example.com" } as unknown as UserRequest;
      const created = { id: "1", email: "rizki@example.com" };
      service.createUser.mockResolvedValue({ data: created });

      await controller.createUser(createMockRequest({ body }), res);

      expect(service.createUser).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "user created",
        data: created,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("calls handleError when the service throws", async () => {
      const error = new Error("create failed");
      service.createUser.mockRejectedValue(error);

      await controller.createUser(createMockRequest({ body: {} }), res);

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("updates a user and returns 200", async () => {
      const body = { name: "Jane" } as unknown as UpdateUser;
      const updated = { id: "1", name: "Jane" };
      service.updateUser.mockResolvedValue({ data: updated });

      await controller.updateUser(
        createMockRequest({ params: { id: "1" }, body }),
        res,
      );

      expect(service.updateUser).toHaveBeenCalledWith("1", body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "user updated",
        data: updated,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("calls handleError when the service throws", async () => {
      const error = new Error("update failed");
      service.updateUser.mockRejectedValue(error);

      await controller.updateUser(
        createMockRequest({ params: { id: "1" }, body: {} }),
        res,
      );

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("deletes a user and returns 200", async () => {
      service.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser(
        createMockRequest({ params: { id: "1" } }),
        res,
      );

      expect(service.deleteUser).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "user deleted" });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("calls handleError when the service throws", async () => {
      const error = new Error("delete failed");
      service.deleteUser.mockRejectedValue(error);

      await controller.deleteUser(
        createMockRequest({ params: { id: "1" } }),
        res,
      );

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("loginUser", () => {
    const loginResult = {
      accessToken: "access-token",
      tokenRandomString: "random-refresh-token",
      data: { id: "1", email: "john@example.com" },
    };

    const loginRequest = () =>
      createMockRequest({
        body: { email: "john@example.com", password: "secret" },
        ip: "127.0.0.1",
        headers: { "user-agent": "Mozilla/5.0" },
      });

    it("passes credentials, ip and user-agent to the service", async () => {
      service.loginUser.mockResolvedValue(loginResult);

      await controller.loginUser(loginRequest(), res);

      expect(service.loginUser).toHaveBeenCalledWith(
        "john@example.com",
        "secret",
        "127.0.0.1",
        "Mozilla/5.0",
      );
    });

    it("sets the refresh token cookie and returns 200 with the access token", async () => {
      service.loginUser.mockResolvedValue(loginResult);

      await controller.loginUser(loginRequest(), res);

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "random-refresh-token",
        {
          httpOnly: true,
          sameSite: "lax",
          maxAge: SEVEN_DAYS,
          secure: false,
        },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "user logged in",
        accessToken: "access-token",
        data: loginResult.data,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("marks the cookie as secure in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      service.loginUser.mockResolvedValue(loginResult);

      await controller.loginUser(loginRequest(), res);

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "random-refresh-token",
        expect.objectContaining({ secure: true }),
      );
    });

    it("does not set a cookie and calls handleError when the service throws", async () => {
      const error = new Error("invalid credentials");
      service.loginUser.mockRejectedValue(error);

      await controller.loginUser(loginRequest(), res);

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken", () => {
    const refreshResult = {
      accessToken: "new-access-token",
      tokenRandomString: "new-random-refresh-token",
      data: { id: "1", email: "john@example.com" },
    };

    it("reads the refresh token from cookies and forwards it to the service", async () => {
      service.refreshToken.mockResolvedValue(refreshResult);

      await controller.refreshToken(
        createMockRequest({ cookies: { refreshToken: "old-token" } }),
        res,
      );

      expect(service.refreshToken).toHaveBeenCalledWith("old-token");
    });

    it("rotates the cookie and returns 200 with the new access token", async () => {
      service.refreshToken.mockResolvedValue(refreshResult);

      await controller.refreshToken(
        createMockRequest({ cookies: { refreshToken: "old-token" } }),
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "new-random-refresh-token",
        {
          httpOnly: true,
          sameSite: "lax",
          maxAge: SEVEN_DAYS,
          secure: false,
        },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "new refresh token",
        accessToken: "new-access-token",
        data: refreshResult.data,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("marks the cookie as secure in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      service.refreshToken.mockResolvedValue(refreshResult);

      await controller.refreshToken(
        createMockRequest({ cookies: { refreshToken: "old-token" } }),
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "new-random-refresh-token",
        expect.objectContaining({ secure: true }),
      );
    });

    it("calls handleError and sets no cookie when the service throws", async () => {
      const error = new Error("unauthorized");
      service.refreshToken.mockRejectedValue(error);

      await controller.refreshToken(
        createMockRequest({ cookies: { refreshToken: "old-token" } }),
        res,
      );

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("calls handleError when req.cookies is undefined (no cookie-parser)", async () => {
      await controller.refreshToken(
        createMockRequest({ cookies: undefined }),
        res,
      );

      expect(service.refreshToken).not.toHaveBeenCalled();
      expect(handleErrorSpy).toHaveBeenCalledWith(res, expect.any(TypeError));
    });
  });

  describe("logoutUser", () => {
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      maxAge: SEVEN_DAYS,
      secure: false,
    };

    it("revokes the token, clears the cookie and returns 200", async () => {
      service.logoutUser.mockResolvedValue(undefined);

      await controller.logoutUser(
        createMockRequest({ cookies: { refreshToken: "old-token" } }),
        res,
      );

      expect(service.logoutUser).toHaveBeenCalledWith("old-token");
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        cookieOptions,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "user logged out" });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("marks the cleared cookie as secure in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      service.logoutUser.mockResolvedValue(undefined);

      await controller.logoutUser(
        createMockRequest({ cookies: { refreshToken: "old-token" } }),
        res,
      );

      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.objectContaining({ secure: true }),
      );
    });

    it("still clears the cookie before calling handleError when the service throws", async () => {
      const error = new Error("unauthorized");
      service.logoutUser.mockRejectedValue(error);

      await controller.logoutUser(
        createMockRequest({ cookies: { refreshToken: "old-token" } }),
        res,
      );

      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        cookieOptions,
      );
      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.clearCookie.mock.invocationCallOrder[0]).toBeLessThan(
        handleErrorSpy.mock.invocationCallOrder[0] as number,
      );
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("findAllUser", () => {
    it("returns all users with status 200", async () => {
      const users = [
        { id: "1", email: "a@example.com" },
        { id: "2", email: "b@example.com" },
      ];
      service.findAllUser.mockResolvedValue({ data: users });

      await controller.findAllUser(createMockRequest(), res);

      expect(service.findAllUser).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "find all users",
        data: users,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("calls handleError when the service throws", async () => {
      const error = new Error("user not found");
      service.findAllUser.mockRejectedValue(error);

      await controller.findAllUser(createMockRequest(), res);

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("findUserById", () => {
    it("returns the user with status 200", async () => {
      const user = { id: "1", email: "john@example.com" };
      service.findUserById.mockResolvedValue({ data: user });

      await controller.findUserById(
        createMockRequest({ params: { id: "1" } }),
        res,
      );

      expect(service.findUserById).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "find user by id",
        data: user,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("calls handleError when the service throws", async () => {
      const error = new Error("user not found");
      service.findUserById.mockRejectedValue(error);

      await controller.findUserById(
        createMockRequest({ params: { id: "999" } }),
        res,
      );

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
