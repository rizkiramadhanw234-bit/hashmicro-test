"use client";

import { axiosApi } from "@/services/axios";
import type { AuthResponse } from "@/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { accessToken, setUser, isHydrated } = useAuthStore();

  useEffect(() => {
    axiosApi
      .post<AuthResponse>("/auth/refresh-token")
      .then((res) => {
        if (!res.data.accessToken) {
          router.push("/auth/sign-in");
        }
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
        router.push("/auth/sign-in");
      });
  }, []);

  if (loading || !isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!accessToken) return null;

  return <>{children}</>;
}
