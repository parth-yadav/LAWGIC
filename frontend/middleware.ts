import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import getNewAccessToken from "./auth/getNewAccessToken";

export async function middleware(request: NextRequest) {
  const path = new URL(request.url).pathname;
  const cookieStore = await cookies();

  const authRoutes = ["/login"];

  const isAuthRoute = authRoutes.includes(path);

  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!isAuthRoute && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isAuthRoute && !accessToken && refreshToken) {
    const newAccessToken = await getNewAccessToken(refreshToken);
    if (newAccessToken) {
      cookieStore.set("accessToken", newAccessToken);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
