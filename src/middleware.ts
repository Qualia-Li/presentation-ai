// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "@auth/core/jwt"; // <--- CHANGE THIS IMPORT PATH!

export async function middleware(request: NextRequest) {
  // Use getToken to check for the session token in an Edge-compatible way.
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

  // Always redirect from root to /presentation
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/presentation", request.url));
  }

  // If user is on auth page but already signed in, redirect to home page
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/presentation", request.url));
  }

  // If user is not authenticated (no token) and trying to access a protected route, redirect to sign-in
  if (!token && !isAuthPage && !request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.redirect(
      new URL(
        `/auth/signin?callbackUrl=${encodeURIComponent(request.url)}`,
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};