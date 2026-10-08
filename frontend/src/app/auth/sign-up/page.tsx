"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateUser } from "@/hooks/auth.hooks";
import type { UserRequest } from "@/types/user.type";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserSchema } from "@/validation/user.validation";

export default function Page() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { mutateAsync: createUser, isPending, isError } = useCreateUser();
  const [form, setForm] = useState<UserRequest>({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = createUserSchema.safeParse(form);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string>,
      );
      return;
    }

    try {
      await createUser(result.data);
      router.push("/auth/sign-in");
    } catch {
      console.error(isError);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {isError && <p className="text-red-500">Email has been taken</p>}
          <CardTitle>Create new account</CardTitle>
          {/* <CardDescription>Create new account</CardDescription> */}
          <CardAction>
            <Button variant="link" onClick={() => router.push("/auth/sign-in")}>
              Sign In
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="name"
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {fieldErrors.name && (
                  <p className="text-red-500">{fieldErrors.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {fieldErrors.email && (
                  <p className="text-red-500">{fieldErrors.email}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                {fieldErrors.password && (
                  <p className="text-red-500">{fieldErrors.password}</p>
                )}
              </div>
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full">
                {isPending ? "Loading..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
