import { axiosApi, refreshAuth } from "./axios";
import type {
  LoginRequest,
  AuthResponse,
  UserRequestResponse,
} from "@/types/auth.type";
import type { UserRequest } from "@/types/user.type";

export async function createUser(data: UserRequest) {
  const res = await axiosApi.post<UserRequestResponse>("/auth/create", data);
  return res.data.data;
}

export async function loginUser(data: LoginRequest) {
  const res = await axiosApi.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function logoutUser() {
  const res = await axiosApi.post("/auth/logout");
  res.data;
}

export async function refreshToken() {
  const res = await refreshAuth();
  return res.data;
}
