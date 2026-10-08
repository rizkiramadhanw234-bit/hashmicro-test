import { UserType } from "./user.type";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  data: UserType;
}

export interface UserRequestResponse {
  message: string;
  data: UserType;
}
