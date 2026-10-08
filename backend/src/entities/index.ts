import { Product } from "../modules/product/product.entity.js";
import { Session } from "../modules/user/session.entity.js";
import { RefreshToken } from "../modules/user/token.entity.js";
import { User } from "../modules/user/user.entity.js";

export const entities = [Product, User, RefreshToken, Session];
