"use client";

import type {
  ProductType,
  ProductRequest,
  UpdateProduct,
} from "@/types/products.type";
import { useEffect, useState } from "react";
import { useCreateProduct, useUpdateProduct } from "@/hooks/product.hook";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductProps {
  data: ProductType | null;
}
export default function ProductModal({ data }: ProductProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ProductRequest>({
    productName: "",
    price: 0,
  });

  const {
    mutateAsync: createProduct,
    isPending: isCreatePending,
    isError: isCreateError,
  } = useCreateProduct();
  const {
    mutateAsync: updateProduct,
    isPending: isUdpdatePending,
    isError: isUpdateError,
  } = useUpdateProduct(data?.id ?? "");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      productName: data?.productName ?? "",
      price: data?.price ?? 0,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (data) {
      await updateProduct(form as UpdateProduct);
    } else {
      await createProduct(form as ProductRequest);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger
          render={<Button variant="outline">{data ? "Edit" : "Add"}</Button>}
        />
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{data ? "Edit" : "Add"}</DialogTitle>
              <DialogDescription>
                Make changes to your data here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="productName">Name</Label>
                <Input
                  id="naproductName"
                  name="productName"
                  defaultValue={data?.productName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      productName: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  defaultValue={data?.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button type="submit">
                {isCreatePending || isUdpdatePending
                  ? "Loading..."
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
