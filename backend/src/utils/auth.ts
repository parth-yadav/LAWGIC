import { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { StringValue } from "ms";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export const refreshSecret: jwt.Secret = process.env.REFRESH_SECRET ?? "";
export const accessSecret: jwt.Secret = process.env.ACCESS_SECRET ?? "";
export const refreshTokenExpiry =
  process.env.REFRESH_TOKEN_EXPIRY ?? ("7d" as StringValue);
export const accessTokenExpiry =
  process.env.ACCESS_TOKEN_EXPIRY ?? ("60m" as StringValue);
export const saltRounds = 10;
