"use server";
import { cookies } from "next/headers";
import getNewAccessToken from "./getNewAccessToken";

const getUser = async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies();

    let accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) return null;
    if (!accessToken) {
      accessToken = await getNewAccessToken(refreshToken);
      if (typeof accessToken === "string") {
        cookieStore.set("accessToken", accessToken);
      }
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
    console.error("Failed to get user:", error);
    return null;
  }
};

export default getUser;
