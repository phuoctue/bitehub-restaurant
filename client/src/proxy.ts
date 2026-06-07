import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "./lib/utils";
import { Role } from "./constants/type";
import { routing } from "./i18n/routing";

const managePaths = ["/manage"];
const guestPaths = ["/guest"];
const privatePaths = [...managePaths, ...guestPaths];
const oauthPaths = ["/oauth"];

function parseLocaleAndPath(pathname: string, localeFromCookie?: string) {
  const firstSegment = pathname.split("/")[1];
  const localeFromPrefix = routing.locales.includes(firstSegment as (typeof routing.locales)[number])
    ? firstSegment
    : undefined;
  const localeFromStoredCookie = routing.locales.includes(localeFromCookie as (typeof routing.locales)[number])
    ? localeFromCookie
    : undefined;
  const locale = localeFromPrefix ?? localeFromStoredCookie ?? routing.defaultLocale;

  const hasLocalePrefix = Boolean(localeFromPrefix);
  const normalizedPath = hasLocalePrefix ? pathname.slice(locale.length + 1) || "/" : pathname;

  return { locale, normalizedPath, hasLocalePrefix };
}

function withLocalePrefix(pathname: string, locale: string) {
  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function getExpiredGuestRedirect(
  pathname: string,
  locale: string,
  requestUrl: string,
) {
  const isGuestPath = guestPaths.some((path) => pathname.startsWith(path));
  if (isGuestPath) {
    return new URL(withLocalePrefix("/", locale), requestUrl);
  }
  return new URL(withLocalePrefix("/login", locale), requestUrl);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeFromCookie = request.cookies.get("NEXT_LOCALE")?.value;
  const { locale, normalizedPath, hasLocalePrefix } = parseLocaleAndPath(pathname, localeFromCookie);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  if (hasLocalePrefix) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = normalizedPath;
    response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders
      }
    });
  }

  response.cookies.set("NEXT_LOCALE", locale, { path: "/" });

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const isPrivatePath = privatePaths.some((path) => normalizedPath.startsWith(path));
  const isOauthPath = oauthPaths.some((path) => normalizedPath.startsWith(path));

  if (isPrivatePath && !refreshToken) {
    const url = getExpiredGuestRedirect(normalizedPath, locale, request.url);
    if (!normalizedPath.startsWith("/guest")) {
      url.searchParams.set("clearTokens", "true");
    }
    return NextResponse.redirect(url);
  }

  if (refreshToken) {
    if (isOauthPath && accessToken) {
      return NextResponse.redirect(new URL(withLocalePrefix("/manage/dashboard", locale), request.url));
    }

    if (isPrivatePath && !accessToken) {
      const url = new URL(withLocalePrefix("/refresh-token", locale), request.url);
      url.searchParams.set("redirect", normalizedPath);
      return NextResponse.redirect(url);
    }

    // Check if accessToken is expired
    if (accessToken && isPrivatePath) {
      try {
        const decodedAccessToken = decodeToken(accessToken);
        const now = Math.round(new Date().getTime() / 1000);
        // If accessToken is expired, redirect to refresh-token page
        if (decodedAccessToken.exp <= now) {
          const url = new URL(withLocalePrefix("/refresh-token", locale), request.url);
          url.searchParams.set("redirect", normalizedPath);
          return NextResponse.redirect(url);
        }
      } catch {
        // If decodeToken fails, redirect to refresh-token page
        const url = new URL(withLocalePrefix("/refresh-token", locale), request.url);
        url.searchParams.set("redirect", normalizedPath);
        return NextResponse.redirect(url);
      }
    }

    try {
      const role = decodeToken(refreshToken).role;
      const isGuestGoToManagePath = role === Role.Guest && managePaths.some((path) => normalizedPath.startsWith(path));
      const isNotGuestGoToGuestPath = role !== Role.Guest && guestPaths.some((path) => normalizedPath.startsWith(path));

      if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
        return NextResponse.redirect(new URL(withLocalePrefix("/", locale), request.url));
      }
    } catch {
      return NextResponse.redirect(
        getExpiredGuestRedirect(normalizedPath, locale, request.url),
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
