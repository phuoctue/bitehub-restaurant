import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "./lib/utils";
import { Role } from "./constants/type";

// Cấu hình các đường dẫn theo prefix để bao phủ toàn bộ trang con
const managePaths = ["/manage"];
const guestPaths = ["/guest"];
const privatePaths = [...managePaths, ...guestPaths];
const unAuthPaths = ["/login", "/oauth"]; // Thêm /oauth vào đây

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const isPrivatePath = privatePaths.some((path) => pathname.startsWith(path));
  const isUnAuthPath = unAuthPaths.some((path) => pathname.startsWith(path));

  // 1. Chưa đăng nhập
  if (isPrivatePath && !refreshToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }

  // 2. Đã có refreshToken
  if (refreshToken) {
    // Nếu vào trang login/oauth khi đã có token
    if (isUnAuthPath && accessToken) {
      return NextResponse.redirect(new URL("/manage/dashboard", request.url));
    }

    // Refresh token logic
    if ((isPrivatePath || isUnAuthPath) && !accessToken) {
      const url = new URL("/refresh-token", request.url);
      url.searchParams.set("refreshToken", refreshToken);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // 3. Kiểm tra Role
    try {
      const role = decodeToken(refreshToken).role;
      const isGuestGoToManagePath = role === Role.Guest && managePaths.some((path) => pathname.startsWith(path));
      const isNotGuestGoToGuestPath = role !== Role.Guest && guestPaths.some((path) => pathname.startsWith(path));

      if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      // Nếu token lỗi, redirect về login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*", "/guest/:path*", "/login", "/oauth"],
};