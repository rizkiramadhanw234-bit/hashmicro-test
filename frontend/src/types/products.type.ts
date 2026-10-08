import { BaseType } from "./base.type";

export interface ProductType extends BaseType {
  productName: string;
  price: number;
  matchedChars: string[];
  matchedCount: number;
  totalChars: number;
  percentage: string;
  status: MatchStatus;
}

export interface ProductRequest {
  productName: string;
  price: number;
}

export type UpdateProduct = Partial<ProductRequest>;

export type MatchStatus = "partial match" | "full match";

export interface ProductMeta {
  total: number;
  limit: number;
  offset: number;
  types: string;
}

export interface ProductListResponse {
  message: string;
  data: ProductType[];
  meta: ProductMeta;
}
