import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import getNewAccessToken from "./auth/getNewAccessToken";

export async function middleware(request: NextRequest) {
  const path = new URL(request.url).pathname;
  const cookieStore = await cookies();

  const isAuthRoute = ["/login"].includes(path);

  const accessToken = cookieStore.get("accessToken")?.value ?? null;
  const refreshToken = cookieStore.get("refreshToken")?.value ?? null;

  if (!accessToken && refreshToken) {
    const newAccessToken = await getNewAccessToken(refreshToken);
    if (typeof newAccessToken?.accessToken === "string") {
      cookieStore.set({
        name: "accessToken",
        value: newAccessToken.accessToken,
        maxAge: newAccessToken.maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
