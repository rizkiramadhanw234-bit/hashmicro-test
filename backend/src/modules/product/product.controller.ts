import type { Request, Response } from "express";
import { ProductService } from "./product.service.js";
import { BaseController } from "../../utils/base.controller.js";
import type { CaseType, ProductDto, UpdateProduct } from "./product.dto.js";

export class ProductController extends BaseController {
  constructor(private readonly productService: ProductService) {
    super();
  }

  createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const formBody = req.body as ProductDto;
      const { data } = await this.productService.createProduct(formBody);
      res.status(201).json({ message: "product created", data });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const formBody = req.body as UpdateProduct;
      const { data } = await this.productService.updateProduct(id, formBody);
      res.status(200).json({ message: "product updated", data });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      await this.productService.deleteProduct(id);
      res.status(200).json({ message: "product deleted" });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  findAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Number(req.query.limit) || 10;
      const offset = Number(req.query.offset) || 0;
      const { productName, type } = req.query as {
        productName?: string;
        type?: CaseType;
      };
      const { data, meta } = await this.productService.findAllProducts(
        limit,
        offset,
        productName,
        type,
      );
      res.status(200).json({ message: "find all products", data, meta });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  findProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { data } = await this.productService.findProductById(id);
      res.status(200).json({ message: "find product by id", data });
    } catch (error) {
      this.handleError(res, error);
    }
  };
}
