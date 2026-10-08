import { useAuthStore } from "@/stores/auth.store";
import axios from "axios";
import type { AuthResponse } from "@/types/auth.type";

export const axiosApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
});

let refreshRequest: Promise<{
  data: AuthResponse;
}> | null = null;

export function refreshAuth() {
  if (!refreshRequest) {
    refreshRequest = axiosApi
      .post<AuthResponse>("/auth/refresh-token")
      .then((response) => response)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

axiosApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest.url?.includes(
      "/auth/refresh-token",
    );
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;
      try {
        const response = await refreshAuth();
        const { accessToken } = response.data;
        useAuthStore.getState().setUser(response.data);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosApi(originalRequest);
      } catch {
        useAuthStore.getState().setUser(null);
        window.location.href = "/auth/sign-in";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
