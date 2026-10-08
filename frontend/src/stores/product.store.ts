import { create } from "zustand";

interface ProductStoreType {
  page: number;
  productName: string;
  type: string;

  setPage: (page: number) => void;
  setProductName: (productName: string) => void;
  setType: (type: string) => void;
}

export const useProductStore = create<ProductStoreType>((set) => ({
  page: 1,
  productName: "",
  type: "",

  setPage(page) {
    set({ page: page });
  },

  setProductName(productName) {
    set({ productName: productName });
  },

  setType(type) {
    set({ type: type });
  },
}));
