import { routing } from "@/i18n/routing";

function normalizePath(path: string) {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

export function extractLocaleFromPath(pathname: string) {
  const firstSegment = pathname.split("/")[1];
  if (routing.locales.includes(firstSegment as (typeof routing.locales)[number])) {
    return firstSegment;
  }
  return null;
}

export function getLocaleFromCookie() {
  if (typeof document === "undefined") return null;
  const localeCookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("NEXT_LOCALE="))
    ?.split("=")[1];
  if (!localeCookie) return null;
  const decoded = decodeURIComponent(localeCookie);
  if (routing.locales.includes(decoded as (typeof routing.locales)[number])) {
    return decoded;
  }
  return null;
}

export function withLocalePath(path: string, pathname?: string) {
  const normalized = normalizePath(path);
  const localeAlreadyInPath = extractLocaleFromPath(normalized);
  if (localeAlreadyInPath) {
    return normalized;
  }
  const localeFromPath = pathname ? extractLocaleFromPath(pathname) : null;
  const locale = localeFromPath ?? getLocaleFromCookie() ?? routing.defaultLocale;
  return `/${locale}${normalized}`;
}
