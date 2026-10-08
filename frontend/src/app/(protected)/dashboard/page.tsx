"use client";

import { useFindAllProducts } from "@/hooks/product.hook";
import { useProductStore } from "@/stores/product.store";
import { useState, useRef } from "react";

export default function Page() {
  const types = [
    { label: "Sensitive", value: "sensitive" },
    { label: "Non Sensitive", value: "non_sensitive" },
  ];

  const { page, setPage, productName, setProductName, setType, type } =
    useProductStore();
  const [search, setSearch] = useState(productName ?? "");
  const debouncedSearch = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: products, isLoading } = useFindAllProducts(
    99,
    0,
    productName,
    type,
  );
  const productsData = products?.data ?? [];
  console.log(productsData);

  return (
    <>
      <div>
        <h1>sada</h1>
      </div>
    </>
  );
}
