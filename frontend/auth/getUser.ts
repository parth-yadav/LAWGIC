"use server";

import { cookies } from "next/headers";
import getNewAccessToken from "./getNewAccessToken";

export default async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();

    let accessToken = cookieStore.get("accessToken")?.value ?? null;
    const refreshToken = cookieStore.get("refreshToken")?.value ?? null;

    if (!refreshToken) return null;

    if (!accessToken) {
      const newAccessToken = await getNewAccessToken(refreshToken);
      if (typeof newAccessToken?.accessToken !== "string") return null;

      accessToken = newAccessToken.accessToken;

      cookieStore.set({
        name: "accessToken",
        value: newAccessToken.accessToken,
        maxAge: newAccessToken.maxAge,
      });
    }
    if (!accessToken) return null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/auth/user`,
      {
        headers: {
          "Content-Type": "application/json",
          "access-token": accessToken,
        },
        cache: "no-store",
      }
    );
    if (!response.ok) {
      console.error("Failed to fetch user:", response.statusText);
      return null;
    }
    const {
      data: { user },
    }: { data: { user: User } } = await response.json();

    return user;
  } catch (error) {
    return null;
  }
}
