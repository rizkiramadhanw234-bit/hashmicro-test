import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Repository } from "typeorm";
import { ProductService } from "../product.service.js";
import type { Product } from "../product.entity.js";
import type { ProductDto, UpdateProduct } from "../product.dto.js";
import { AppError } from "../../../utils/app.error.js";

type MockRepo = {
  findOneBy: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  findAndCount: ReturnType<typeof vi.fn>;
};

const expectAppError = async (promise: Promise<unknown>, message: string) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  expect((error as Error).message).toBe(message);
};

const asProduct = (p: Record<string, unknown>) => p as unknown as Product;

const apple = asProduct({ id: "1", productName: "Apple", price: "10.50" });
const banana = asProduct({ id: "2", productName: "Banana", price: "5" });
const pineapple = asProduct({ id: "3", productName: "Pineapple", price: "20" });

describe("ProductService", () => {
  let repo: MockRepo;
  let service: ProductService;

  beforeEach(() => {
    repo = {
      findOneBy: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn(),
    };
    service = new ProductService(repo as unknown as Repository<Product>);
  });

  describe("createProduct", () => {
    const dto = {
      productName: "Coffee",
      price: "15000",
    } as unknown as ProductDto;

    it("throws a conflict error when the product name already exists", async () => {
      repo.findOneBy.mockResolvedValue(apple);

      await expectAppError(service.createProduct(dto), "Product exist");

      expect(repo.findOneBy).toHaveBeenCalledWith({ productName: "Coffee" });
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("creates and saves the product with the price converted to a number", async () => {
      const created = { id: "9", productName: "Coffee", price: 15000 };
      repo.findOneBy.mockResolvedValue(null);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.createProduct(dto);

      expect(repo.create).toHaveBeenCalledWith({
        productName: "Coffee",
        price: 15000,
      });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual({ data: created });
    });
  });

  describe("updateProduct", () => {
    it("throws not found when the product id does not exist", async () => {
      repo.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expectAppError(
        service.updateProduct("404", { productName: "New" } as UpdateProduct),
        "product not found",
      );

      expect(repo.save).not.toHaveBeenCalled();
    });

    it("throws a conflict error when the new product name is already taken", async () => {
      repo.findOneBy.mockResolvedValueOnce(apple).mockResolvedValueOnce(banana);

      await expectAppError(
        service.updateProduct("1", { productName: "Banana" } as UpdateProduct),
        "Product exist",
      );

      expect(repo.save).not.toHaveBeenCalled();
    });

    it("looks up the product by id and by the new product name", async () => {
      repo.findOneBy.mockResolvedValueOnce(apple).mockResolvedValueOnce(null);
      repo.save.mockResolvedValue({});

      await service.updateProduct("1", {
        productName: "Green Apple",
      } as UpdateProduct);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: "1" });
      expect(repo.findOneBy).toHaveBeenCalledWith({
        productName: "Green Apple",
      });
    });

    it("merges the update into the product and converts price to a number", async () => {
      repo.findOneBy.mockResolvedValueOnce(apple).mockResolvedValueOnce(null);
      repo.save.mockImplementation(async (p: unknown) => p);

      const result = await service.updateProduct("1", {
        productName: "Green Apple",
        price: "12.75",
      } as unknown as UpdateProduct);

      expect(repo.save).toHaveBeenCalledWith({
        id: "1",
        productName: "Green Apple",
        price: 12.75,
      });
      expect(result.data).toEqual({
        id: "1",
        productName: "Green Apple",
        price: 12.75,
      });
    });

    it("keeps the existing price when price is not part of the update", async () => {
      repo.findOneBy.mockResolvedValueOnce(apple).mockResolvedValueOnce(null);
      repo.save.mockImplementation(async (p: unknown) => p);

      const result = await service.updateProduct("1", {
        productName: "Green Apple",
      } as UpdateProduct);

      expect(result.data).toMatchObject({
        id: "1",
        productName: "Green Apple",
        price: "10.50",
      });
    });
  });

  describe("deleteProduct", () => {
    it("throws not found when the product does not exist", async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expectAppError(service.deleteProduct("404"), "product not found");

      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("deletes the product by id", async () => {
      repo.findOneBy.mockResolvedValue(apple);
      repo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteProduct("1");

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: "1" });
      expect(repo.delete).toHaveBeenCalledWith("1");
      expect(result).toBeUndefined();
    });
  });

  describe("findProductById", () => {
    it("throws not found when the product does not exist", async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expectAppError(service.findProductById("404"), "product not found");
    });

    it("returns the product with the price converted to a number", async () => {
      repo.findOneBy.mockResolvedValue(apple);

      const result = await service.findProductById("1");

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: "1" });
      expect(result).toEqual({
        data: { id: "1", productName: "Apple", price: 10.5 },
      });
    });
  });

  describe("findAllProducts", () => {
    describe("without productName (plain pagination)", () => {
      it("returns paginated products with numeric prices and meta", async () => {
        repo.findAndCount.mockResolvedValue([[apple, banana], 25]);

        const result = await service.findAllProducts(2, 4);

        expect(repo.findAndCount).toHaveBeenCalledWith({
          take: 2,
          skip: 4,
          order: { productName: "ASC" },
        });
        expect(repo.find).not.toHaveBeenCalled();
        expect(result).toEqual({
          data: [
            { id: "1", productName: "Apple", price: 10.5 },
            { id: "2", productName: "Banana", price: 5 },
          ],
          meta: { total: 25, limit: 2, offset: 4 },
        });
      });

      it("throws not found when the page is empty", async () => {
        repo.findAndCount.mockResolvedValue([[], 0]);

        await expectAppError(
          service.findAllProducts(10, 0),
          "products not found",
        );
      });
    });

    describe("with productName (character matching search)", () => {
      beforeEach(() => {
        repo.find.mockResolvedValue([apple, banana, pineapple]);
      });

      it("fetches all products ordered by name instead of using findAndCount", async () => {
        await service.findAllProducts(10, 0, "apple", "non_sensitive" as never);

        expect(repo.find).toHaveBeenCalledWith({
          order: { productName: "ASC" },
        });
        expect(repo.findAndCount).not.toHaveBeenCalled();
      });

      it("matches case-insensitively and sorts by percentage (non-sensitive)", async () => {
        const result = await service.findAllProducts(
          10,
          0,
          "apple",
          "non_sensitive" as never,
        );

        expect(result.meta).toEqual({
          total: 3,
          limit: 10,
          offset: 0,
          types: "non_sensitive",
        });
        expect(result.data).toEqual([
          {
            id: "1",
            productName: "Apple",
            price: 10.5,
            matchedChars: ["a", "p", "p", "l", "e"],
            matchedCount: 5,
            totalChars: 5,
            percentage: "100%",
            status: "full match",
          },
          {
            id: "3",
            productName: "Pineapple",
            price: 20,
            matchedChars: ["a", "p", "p", "l", "e"],
            matchedCount: 5,
            totalChars: 5,
            percentage: "100%",
            status: "full match",
          },
          {
            id: "2",
            productName: "Banana",
            price: 5,
            matchedChars: ["a"],
            matchedCount: 1,
            totalChars: 5,
            percentage: "20%",
            status: "partial match",
          },
        ]);
      });

      it("respects letter case when the type is sensitive", async () => {
        const result = await service.findAllProducts(
          10,
          0,
          "apple",
          "sensitive",
        );

        expect(result.meta).toMatchObject({ total: 3, types: "sensitive" });

        const [first, second, third] = result.data as {
          productName: string;
          percentage: string;
          status: string;
          matchedChars: string[];
        }[];

        expect(first).toMatchObject({
          productName: "Pineapple",
          percentage: "100%",
          status: "full match",
        });
        expect(second).toMatchObject({
          productName: "Apple",
          percentage: "80%",
          status: "partial match",
          matchedChars: ["p", "p", "l", "e"],
        });
        expect(third).toMatchObject({
          productName: "Banana",
          percentage: "20%",
          status: "partial match",
        });
      });

      it("uses sensitive matching by default when type is omitted", async () => {
        const result = await service.findAllProducts(10, 0, "apple");

        expect(result.meta).toMatchObject({ types: "sensitive" });
        expect((result.data as { productName: string }[])[0]?.productName).toBe(
          "Pineapple",
        );
      });

      it("applies limit and offset to the sorted results while keeping the full total", async () => {
        const result = await service.findAllProducts(
          1,
          1,
          "apple",
          "non_sensitive" as never,
        );

        expect(result.meta).toMatchObject({ total: 3, limit: 1, offset: 1 });
        expect(result.data).toHaveLength(1);
        expect((result.data as { productName: string }[])[0]?.productName).toBe(
          "Pineapple",
        );
      });

      it("excludes products with no matching characters", async () => {
        const result = await service.findAllProducts(
          10,
          0,
          "bz",
          "non_sensitive" as never,
        );

        const names = (result.data as { productName: string }[]).map(
          (d) => d.productName,
        );
        expect(names).toEqual(["Banana"]);
        expect(result.meta).toMatchObject({ total: 1 });
      });

      it("throws not found when nothing matches", async () => {
        await expectAppError(
          service.findAllProducts(10, 0, "xyz", "non_sensitive" as never),
          "products not found",
        );
      });

      it("returns an empty page (not an error) when offset is beyond the results", async () => {
        const result = await service.findAllProducts(
          10,
          100,
          "apple",
          "non_sensitive" as never,
        );

        expect(result.data).toEqual([]);
        expect(result.meta).toMatchObject({ total: 3, offset: 100 });
      });
    });

    describe("search edge cases", () => {
      it("rounds the percentage to two decimals", async () => {
        repo.find.mockResolvedValue([banana]);

        const result = await service.findAllProducts(
          10,
          0,
          "abc",
          "non_sensitive" as never,
        );

        expect(result.data[0]).toMatchObject({
          matchedCount: 2,
          totalChars: 3,
          percentage: "66.67%",
          status: "partial match",
        });
      });

      it("counts every repeated character of the search term separately", async () => {
        repo.find.mockResolvedValue([banana]);

        const result = await service.findAllProducts(
          10,
          0,
          "aaa",
          "non_sensitive" as never,
        );

        expect(result.data[0]).toMatchObject({
          matchedChars: ["a", "a", "a"],
          matchedCount: 3,
          totalChars: 3,
          percentage: "100%",
          status: "full match",
        });
      });

      it("treats a missing productName on an entity as an empty string", async () => {
        repo.find.mockResolvedValue([
          asProduct({ id: "4", productName: undefined, price: "1" }),
          apple,
        ]);

        const result = await service.findAllProducts(
          10,
          0,
          "apple",
          "non_sensitive" as never,
        );

        const names = (result.data as { productName: string }[]).map(
          (d) => d.productName,
        );
        expect(names).toEqual(["Apple"]);
      });
    });
  });
});
