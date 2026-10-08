import { z } from "zod";

export const createProductSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(1, "productName is required")
    .max(100, "productName must be at most 100 characters"),
  price: z
    .number({ error: "price must be a number" })
    .positive("price must be greater than 0")
    .finite("price must be a valid number"),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
