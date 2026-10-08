export interface ProductDto {
  productName: string;
  price: number;
}

export type UpdateProduct = Partial<ProductDto>;

export type CaseType = "sensitive" | "non_sensitive";

export interface SearchProductDto {
  keyword: string;
  type: CaseType;
  limit: number;
  offset: number;
}
