import { axiosApi } from "./axios";
import type {
  ProductListResponse,
  ProductRequest,
  UpdateProduct,
  ProductType,
} from "@/types/products.type";

export async function createProduct(data: ProductRequest) {
  const res = await axiosApi.post<{ data: ProductType }>("/products", data);
  return res.data.data;
}

export async function updateProduct(id: string, data: UpdateProduct) {
  const res = await axiosApi.put<{ data: ProductType }>(
    `/products/${id}`,
    data,
  );
  return res.data.data;
}

export async function deleteProduct(id: string) {
  const res = await axiosApi.delete(`/products/${id}`);
  return res.data;
}

export async function findAllProducts(
  limit: number,
  offset: number,
  productName: string,
  type: string,
) {
  const res = await axiosApi.get<ProductListResponse>("/products", {
    params: { limit, offset, productName, type },
  });
  return res.data;
}

export async function findProductById(id: string) {
  const res = await axiosApi.get<{ data: ProductType }>(`/products/${id}`);
  return res.data.data;
}
