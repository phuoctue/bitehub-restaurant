import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ur } from "zod/v4/locales";

const privatePaths = ["/manage"];
const unAuthPaths = ["/login"];

// This function can be marked `async` if using `await` inside
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const isPrivatePath = privatePaths.some((path) => pathname.startsWith(path));
  const isUnAuthPath = unAuthPaths.some((path) => pathname.startsWith(path));

  // Chưa đăng nhập thì không cho vào private paths
  if (isPrivatePath && !refreshToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }
  // Đăng nhập rồi thì sẽ không cho vào login nữa
  // Nhưng chỉ chặn khi có CẢ accessToken (vẫn còn trong phiên làm việc)
  if (isUnAuthPath && refreshToken && accessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Trường hợp: accessToken hết hạn (không còn trong cookie) nhưng refreshToken vẫn còn
  // Áp dụng cho cả khi vào private paths hoặc cố tình vào lại login
  if ((isPrivatePath || isUnAuthPath) && !accessToken && refreshToken) {
    const url = new URL("/refresh-token", request.url);
    url.searchParams.set("refreshToken", refreshToken);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/manage/:path*", "/login"],
};
