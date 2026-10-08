import { create } from "zustand";
import type { UserType } from "@/types/user.type";
import type { AuthResponse } from "@/types/auth.type";

interface AuthStore {
  accessToken: string | null;
  user: UserType | null;
  loading: boolean;
  isHydrated: boolean;

  setUser: (user: AuthResponse | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  loading: true,
  isHydrated: false,

  setUser(user) {
    set({
      accessToken: user?.accessToken,
      user: user?.data,
      loading: false,
      isHydrated: true,
    });
  },

  clearAuth() {
    set({
      accessToken: null,
      user: null,
      loading: false,
      isHydrated: false,
    });
  },
}));
