import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function middleware(req: NextRequest) {
  return NextResponse.next();
}

const authMiddleware = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  if (isApiRoute) return NextResponse.next();

  // Redirect authenticated users away from sign-in page
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isAuthRoute) return NextResponse.next();

  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export default process.env.SKIP_AUTH === "1" ? middleware : authMiddleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
