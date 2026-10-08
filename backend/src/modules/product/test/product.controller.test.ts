import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { ProductController } from "../product.controller.js";
import type { ProductService } from "../product.service.js";
import type { ProductDto, UpdateProduct } from "../product.dto.js";

type MockService = {
  createProduct: ReturnType<typeof vi.fn>;
  updateProduct: ReturnType<typeof vi.fn>;
  deleteProduct: ReturnType<typeof vi.fn>;
  findAllProducts: ReturnType<typeof vi.fn>;
  findProductById: ReturnType<typeof vi.fn>;
};

const createMockResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
};

const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    body: {},
    params: {},
    query: {},
    ...overrides,
  }) as unknown as Request;

describe("ProductController", () => {
  let service: MockService;
  let controller: ProductController;
  let handleErrorSpy: ReturnType<typeof vi.fn>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    service = {
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      deleteProduct: vi.fn(),
      findAllProducts: vi.fn(),
      findProductById: vi.fn(),
    };

    controller = new ProductController(service as unknown as ProductService);

    handleErrorSpy = vi.fn();
    (controller as unknown as { handleError: unknown }).handleError =
      handleErrorSpy;

    res = createMockResponse();
  });

  describe("createProduct", () => {
    it("it should be create a product and return 201", async () => {
      const body = { name: "Coffee" } as unknown as ProductDto;
      const created = { id: "1", name: "Coffee" };
      service.createProduct.mockResolvedValue({ data: created });

      await controller.createProduct(createMockRequest({ body }), res);

      expect(service.createProduct).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "product created",
        data: created,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("it should be call an error when service throw", async () => {
      const error = new Error("create failed");
      service.createProduct.mockRejectedValue(error);

      await controller.createProduct(createMockRequest({ body: {} }), res);

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("updateProduct", () => {
    it("it should be update the product and return 200", async () => {
      const body = { name: "Coffee" } as unknown as UpdateProduct;
      const updated = { id: "1", name: "Coffee" };
      service.updateProduct.mockResolvedValue({ data: updated });

      await controller.updateProduct(
        createMockRequest({ params: { id: "1" }, body }),
        res,
      );

      expect(service.updateProduct).toHaveBeenCalledWith("1", body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "product updated",
        data: updated,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("it should be call an error when service throw", async () => {
      const error = new Error("update failed");
      service.updateProduct.mockRejectedValue(error);

      await controller.updateProduct(
        createMockRequest({ params: { id: "1" }, body: {} }),
        res,
      );

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("deleteProduct", () => {
    it("it should be delete the product and return 200", async () => {
      service.deleteProduct.mockResolvedValue(undefined);

      await controller.deleteProduct(
        createMockRequest({ params: { id: "1" } }),
        res,
      );

      expect(service.deleteProduct).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "product deleted" });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("it should be call an error when service throw", async () => {
      const error = new Error("delete failed");
      service.deleteProduct.mockRejectedValue(error);

      await controller.deleteProduct(
        createMockRequest({ params: { id: "1" } }),
        res,
      );

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("findAllProducts", () => {
    const serviceResult = {
      data: [{ id: "1", name: "Coffee" }],
      meta: { total: 1 },
    };

    it("the default limit=10 and offset=0 if query did not set", async () => {
      service.findAllProducts.mockResolvedValue(serviceResult);

      await controller.findAllProducts(createMockRequest({ query: {} }), res);

      expect(service.findAllProducts).toHaveBeenCalledWith(
        10,
        0,
        undefined,
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "find all products",
        data: serviceResult.data,
        meta: serviceResult.meta,
      });
    });

    it("continuously limit, offset, productName, and type from query", async () => {
      service.findAllProducts.mockResolvedValue(serviceResult);

      await controller.findAllProducts(
        createMockRequest({
          query: {
            limit: "5",
            offset: "20",
            productName: "coffee",
            type: "snake_case",
          } as unknown as Request["query"],
        }),
        res,
      );

      expect(service.findAllProducts).toHaveBeenCalledWith(
        5,
        20,
        "coffee",
        "snake_case",
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("it should be fallback to the default if limit/offset is not a number", async () => {
      service.findAllProducts.mockResolvedValue(serviceResult);

      await controller.findAllProducts(
        createMockRequest({
          query: { limit: "abc", offset: "xyz" } as unknown as Request["query"],
        }),
        res,
      );

      expect(service.findAllProducts).toHaveBeenCalledWith(
        10,
        0,
        undefined,
        undefined,
      );
    });

    it("it should be fallback to the default if limit=0 (falsy)", async () => {
      service.findAllProducts.mockResolvedValue(serviceResult);

      await controller.findAllProducts(
        createMockRequest({
          query: { limit: "0", offset: "0" } as unknown as Request["query"],
        }),
        res,
      );

      expect(service.findAllProducts).toHaveBeenCalledWith(
        10,
        0,
        undefined,
        undefined,
      );
    });

    it("it should be call an error when service throw", async () => {
      const error = new Error("find all failed");
      service.findAllProducts.mockRejectedValue(error);

      await controller.findAllProducts(createMockRequest({ query: {} }), res);

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("findProductById", () => {
    it("it should be return product and status 200", async () => {
      const product = { id: "1", name: "Coffee" };
      service.findProductById.mockResolvedValue({ data: product });

      await controller.findProductById(
        createMockRequest({ params: { id: "1" } }),
        res,
      );

      expect(service.findProductById).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "find product by id",
        data: product,
      });
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });

    it("it should be call an error when service throw", async () => {
      const error = new Error("not found");
      service.findProductById.mockRejectedValue(error);

      await controller.findProductById(
        createMockRequest({ params: { id: "999" } }),
        res,
      );

      expect(handleErrorSpy).toHaveBeenCalledWith(res, error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
