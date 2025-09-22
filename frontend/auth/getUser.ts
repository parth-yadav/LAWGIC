"use server";

import { cookies, headers } from "next/headers";

export default async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const headersStore = await headers();

    const accessToken =
      cookieStore.get("accessToken")?.value ??
      headersStore.get("x-access-token") ??
      null;

    if (!accessToken) return null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/user`,
      {
        headers: {
          "Content-Type": "application/json",
          "access-token": accessToken,
        },
        cache: "no-store",
      }
    );
    if (!response.ok) {
      console.error("Failed to fetch user.");
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
