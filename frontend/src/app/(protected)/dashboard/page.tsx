"use client";

import { useFindAllProducts } from "@/hooks/product.hook";
import { useProductStore } from "@/stores/product.store";
import { useLogoutUser } from "@/hooks/auth.hooks";
import { useState, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import ProductModal from "@/components/modals/product.modal";
import ProductDelete from "@/components/modals/product.delete";
import { Button } from "@/components/ui/button";

export default function Page() {
  const types = [
    { label: "Sensitive", value: "sensitive" },
    { label: "Non Sensitive", value: "non_sensitive" },
  ];

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const productName = searchParams.get("name") ?? "";
  const type = searchParams.get("type") ?? "";
  const [search, setSearch] = useState(productName ?? "");

  const debouncedSearch = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: products, isLoading } = useFindAllProducts(
    99,
    0,
    productName,
    type,
  );
  const productsData = products?.data ?? [];
  const totalProducts = products?.meta.total ?? 0;

  const updateParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key);
      else params.set(key, String(value));
    });

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }

    debouncedSearch.current = setTimeout(() => {
      updateParams({ name: value, page: 1 });
    }, 500);
  };

  const handleSelectTypes = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ type: e.target.value, page: 1 });
  };

  const { mutateAsync: logout, isPending: isLogoutPending } = useLogoutUser();
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="p-6">
      <div className="pb-2 flex items-center justify-between">
        <div className="flex gap-4">
          <Input
            className="w-50"
            placeholder="Search product..."
            value={search}
            onChange={handleSearch}
          />

          <NativeSelect onChange={handleSelectTypes}>
            <NativeSelectOption value="">Select types</NativeSelectOption>
            {types.map((data) => (
              <NativeSelectOption key={data.value} value={data.value}>
                {data.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex gap-4 items-center">
          <ProductModal data={null} />
          <Button variant="default" onClick={handleLogout}>
            {isLogoutPending ? "Loading..." : "Logout"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {productsData.length === 0 ? (
            <div>
              <p>Product not found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableCaption>Total Products: {totalProducts}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-25">No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Match Chars</TableHead>
                    <TableHead>Match Count</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData.map((data, i) => (
                    <TableRow key={data.id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>{data.productName}</TableCell>
                      <TableCell>{data.price}</TableCell>
                      <TableCell>{data.status ?? "-"}</TableCell>
                      <TableCell>{data.percentage ?? "-"}</TableCell>
                      <TableCell>{data.matchedChars ?? "-"}</TableCell>
                      <TableCell>{data.matchedCount ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <ProductModal data={data} />
                        <ProductDelete id={data.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </>
      )}
    </div>
  );
}
