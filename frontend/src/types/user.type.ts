import { BaseType } from "./base.type";

export interface UserType extends BaseType {
  name: string;
  email: string;
  lastLogin: string;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
}

export type UpdateUser = Partial<UserRequest>;
