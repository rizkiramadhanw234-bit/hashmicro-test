import { Router } from "express";
import { ProductController } from "./product.controller.js";
import { AppDataSource } from "../../configs/db.js";
import { Product } from "./product.entity.js";
import { ProductService } from "./product.service.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createProductSchema } from "./product.validation.js";

const productService = new ProductService(AppDataSource.getRepository(Product));
const controller = new ProductController(productService);

const router = Router();

router.get("/", authMiddleware, controller.findAllProducts);
router.get("/:id", authMiddleware, controller.findProductById);
router.post(
  "/",
  authMiddleware,
  validateBody(createProductSchema),
  controller.createProduct,
);
router.put(
  "/:id",
  authMiddleware,
  validateBody(createProductSchema),
  controller.updateProduct,
);
router.delete("/:id", authMiddleware, controller.deleteProduct);

export default router;
