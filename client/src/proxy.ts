import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "./lib/utils";
import { Role } from "./constants/type";

const managePaths = ["/manage/dashboard", "/manage/dishes", "/manage/orders"];
const guestPaths = ["/guest"];
const privatePaths = [...managePaths, ...guestPaths];
const unAuthPaths = ["/login"];

// This function can be marked `async` if using `await` inside
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const isPrivatePath = privatePaths.some((path) => pathname.startsWith(path));
  const isUnAuthPath = unAuthPaths.some((path) => pathname.startsWith(path));

  // 1. Trường hợp chưa đăng nhập thì không cho vào private paths
  if (isPrivatePath && !refreshToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }

  // 2.Trường hợp đã login
  if (refreshToken) {
    //2.1 nếu cố tình vào trang login sẽ redirect về home
    if (isUnAuthPath && accessToken) {
      // Nhưng chỉ chặn khi có CẢ accessToken (vẫn còn trong phiên làm việc)
      return NextResponse.redirect(new URL("/", request.url));
    }
    // 2.2 Trường hợp accessToken hết hạn (không còn trong cookie) nhưng refreshToken vẫn còn
    // Áp dụng cho cả khi vào private paths hoặc cố tình vào lại login
    if ((isPrivatePath || isUnAuthPath) && !accessToken) {
      const url = new URL("/refresh-token", request.url);
      url.searchParams.set("refreshToken", refreshToken);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    //2.3 vào kh đúng role, redirect về trang chủ
    const role = decodeToken(refreshToken).role;
    //Guest nhưng cố tình vào route admin
    const isGuestGoToManagePath =
      role === Role.Guest &&
      managePaths.some((path) => pathname.startsWith(path));
    //Không phải Guess nhưng cố vào route Guess
    const isNotGuestGoToGuestPath =
      role !== Role.Guest &&
      guestPaths.some((path) => pathname.startsWith(path));
    if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/manage/:path*", "/guest/:path*", "/login"],
};
