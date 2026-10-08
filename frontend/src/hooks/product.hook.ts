import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductRequest, UpdateProduct } from "@/types/products.type";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  findAllProducts,
  findProductById,
} from "@/services/product.service";

export const productKeys = {
  products: ["products"] as const,
  list: (limit: number, offset: number, productName: string, type: string) =>
    [...productKeys.products, { limit, offset, productName, type }] as const,
  detail: (id: string) => [...productKeys.products, { id }] as const,
};

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductRequest) => {
      return await createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.products });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProduct) => {
      return await updateProduct(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.products });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export function useDeleteProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.products });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export function useFindAllProducts(
  limit: number,
  offset: number,
  productName: string,
  type: string,
) {
  return useQuery({
    queryKey: productKeys.list(limit, offset, productName, type),
    queryFn: async () => {
      return await findAllProducts(limit, offset, productName, type);
    },
  });
}

export function useFindProductById(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      return await findProductById(id);
    },
    enabled: !!id,
  });
}
