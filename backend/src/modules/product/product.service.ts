import { Product } from "./product.entity.js";
import type { ProductDto, CaseType, UpdateProduct } from "./product.dto.js";
import { Repository } from "typeorm";
import { AppError, HTTP_STATUS } from "../../utils/app.error.js";

export class ProductService {
  constructor(private readonly productRepo: Repository<Product>) {}

  createProduct = async (data: ProductDto) => {
    const productExist = await this.productRepo.findOneBy({
      productName: data.productName,
    });

    if (productExist) {
      throw new AppError("Product exist", HTTP_STATUS.CONFLICT);
    }

    const price = Number(data.price);
    const newProduct = this.productRepo.create({ ...data, price });
    await this.productRepo.save(newProduct);

    return { data: newProduct };
  };

  updateProduct = async (id: string, data: UpdateProduct) => {
    const [product, productExist] = await Promise.all([
      this.productRepo.findOneBy({ id }),
      this.productRepo.findOneBy({ productName: data.productName }),
    ]);
    if (!product) {
      throw new AppError("product not found", HTTP_STATUS.NOT_FOUND);
    }
    if (productExist) {
      throw new AppError("Product exist", HTTP_STATUS.CONFLICT);
    }

    const price = Number(data.price);
    const updatedProduct = await this.productRepo.save({
      ...product,
      ...data,
      ...(data.price !== undefined && { price }),
    });

    return { data: updatedProduct };
  };

  deleteProduct = async (id: string) => {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) {
      throw new AppError("product not found", HTTP_STATUS.NOT_FOUND);
    }
    await this.productRepo.delete(id);
    return;
  };

  findAllProducts = async (
    limit: number,
    offset: number,
    productName?: string,
    type: CaseType = "sensitive",
  ) => {
    if (!productName) {
      const [products, total] = await this.productRepo.findAndCount({
        take: limit,
        skip: offset,
        order: { productName: "ASC" },
      });

      if (products.length === 0) {
        throw new AppError("products not found", HTTP_STATUS.NOT_FOUND);
      }

      const data = products.map((product) => ({
        ...product,
        price: Number(product.price),
      }));

      return { data, meta: { total, limit, offset } };
    }

    const isSensitive = type === "sensitive";
    const products = await this.productRepo.find({
      order: { productName: "ASC" },
    });

    const results: {
      id: string;
      productName: string;
      price: number;
      matchedChars: string[];
      matchedCount: number;
      totalChars: number;
      percentage: number;
      status: string;
    }[] = [];

    // nested loop
    for (const product of products) {
      const name = product.productName ?? "";
      const matchedChars: string[] = [];
      let matchedCount = 0;

      for (const sourceChar of productName) {
        const normalizedSource = isSensitive
          ? sourceChar
          : sourceChar.toLowerCase();
        let found = false;

        for (const targetChar of name) {
          const normalizedTarget = isSensitive
            ? targetChar
            : targetChar.toLowerCase();

          if (normalizedSource === normalizedTarget) {
            found = true;
            break;
          }
        }

        if (found) {
          matchedCount++;
          matchedChars.push(sourceChar);
        }
      }

      // mathematics
      const percentage =
        Math.round((matchedCount / productName.length) * 10000) / 100;

      // nested if
      if (matchedCount > 0) {
        let status: string;
        if (matchedCount === productName.length) {
          status = "full match";
        } else {
          status = "partial match";
        }

        results.push({
          id: product.id,
          productName: name,
          price: Number(product.price),
          matchedChars,
          matchedCount,
          totalChars: productName.length,
          percentage,
          status,
        });
      }
    }

    if (results.length === 0) {
      throw new AppError("products not found", HTTP_STATUS.NOT_FOUND);
    }

    results.sort((a, b) => b.percentage - a.percentage);

    const total = results.length;
    const paged = results.slice(offset, offset + limit);
    const data = paged.map((item) => ({
      ...item,
      percentage: `${item.percentage}%`,
    }));

    const types = isSensitive ? "sensitive" : "non_sensitive";

    return { data, meta: { total, limit, offset, types } };
  };

  findProductById = async (id: string) => {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) {
      throw new AppError("product not found", HTTP_STATUS.NOT_FOUND);
    }
    const price = Number(product.price);

    return { data: { ...product, price } };
  };
}
