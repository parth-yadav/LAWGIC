import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value ?? null;
    const refreshToken = cookieStore.get("refreshToken")?.value ?? null;

    if (accessToken) return response;

    if (!refreshToken) return response;

    const newTokenResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/auth/refresh`,
      {
        headers: {
          "Content-Type": "application/json",
          "refresh-token": refreshToken,
        },
        cache: "no-store",
      }
    );

    if (!newTokenResponse.ok) return response;

    const {
      data: {
        accessToken: newAccessToken,
        accessTokenExpiresAt,
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt,
      },
    }: {
      data: {
        accessToken: string;
        accessTokenExpiresAt: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
      };
    } = await newTokenResponse.json();

    cookieStore.set({
      name: "accessToken",
      value: newAccessToken,
      expires: new Date(accessTokenExpiresAt),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set({
      name: "refreshToken",
      value: newRefreshToken,
      expires: new Date(refreshTokenExpiresAt),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    response.headers.set("x-access-token", newAccessToken);

    return response;
  } catch (error) {
    console.error("Error occurred in middleware:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
