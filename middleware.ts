import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register"];

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/orders", "/inventory", "/payments", "/clients", "/users", "/settings", "/reports", "/notifications"];

// Admin-only routes
const adminRoutes = ["/users", "/settings/roles"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("woodledger_session");

    // Check if the route is an API route
    if (pathname.startsWith("/api")) {
        // API routes handle their own auth
        return NextResponse.next();
    }

    // Check if route is public
    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith("/api/auth")
    );

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // If protected route and no session, redirect to login
    if (isProtectedRoute && !sessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If user is logged in and tries to access login/register, redirect to dashboard
    if (sessionCookie && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
