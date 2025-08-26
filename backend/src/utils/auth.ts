import { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { StringValue } from "ms";

export const refreshSecret: jwt.Secret = process.env.REFRESH_TOKEN_SECRET ?? "";
export const accessSecret: jwt.Secret = process.env.ACCESS_TOKEN_SECRET ?? "";

export const refreshTokenExpiry = (process.env.REFRESH_TOKEN_EXPIRY ??
  "7d") as StringValue;
export const accessTokenExpiry = (process.env.ACCESS_TOKEN_EXPIRY ??
  "60m") as StringValue;

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: ms(accessTokenExpiry),
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: ms(refreshTokenExpiry),
};

export const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

export const serverBaseUrl = process.env.SERVER_BASE_URL ?? "";
export const clientBaseUrl = process.env.CLIENT_BASE_URL ?? "";

export const googleRedirectPath = process.env.GOOGLE_REDIRECT_PATH ?? "";
export const clientCallbackPath = process.env.CLIENT_CALLBACK_PATH ?? "";

export const googleRedirectUrl = `${serverBaseUrl}${googleRedirectPath}`;
export const clientCallbackUrl = `${clientBaseUrl}${clientCallbackPath}`;

import ms from "ms";

export function getExpiryDate(timeString: string) {
  const milliseconds = ms(timeString as ms.StringValue);
  return new Date(Date.now() + milliseconds);
}
