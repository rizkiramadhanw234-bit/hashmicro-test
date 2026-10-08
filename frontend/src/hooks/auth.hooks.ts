import { useQueryClient, useMutation } from "@tanstack/react-query";
import { loginUser, createUser, logoutUser } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthResponse, LoginRequest } from "@/types/auth.type";
import type { UserRequest } from "@/types/user.type";
import { useRouter } from "next/navigation";

export const authKeys = {
  auth: ["auth"],
} as const;

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UserRequest) => {
      return await createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.auth });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      return await loginUser(data);
    },
    onSuccess: (data: AuthResponse) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: authKeys.auth });
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export function useLogoutUser() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      return await logoutUser();
    },
    onSuccess: () => {
      clearAuth();
      router.push("/auth/sign-in");
    },
  });
}
