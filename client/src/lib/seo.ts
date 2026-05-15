const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

const FALLBACK_SITE_URL = "http://localhost:3000";
const DEFAULT_OG_IMAGE_PATH = "/banner.png";
const SUPPORTED_LOCALES = ["vi", "en"] as const;

function decodeHtmlEntities(input: string) {
  return input.replace(
    /&(?:nbsp|amp|quot|#39|lt|gt);/g,
    (entity) => HTML_ENTITY_MAP[entity] ?? entity,
  );
}

export function htmlToPlainText(html: string, maxLength = 160) {
  const withoutUnsafeTags = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");

  const plainText = decodeHtmlEntities(
    withoutUnsafeTags.replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength).trimEnd()}...`;
}

function normalizeSiteUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_URL?.trim();
  if (!configuredUrl) return FALLBACK_SITE_URL;
  return normalizeSiteUrl(configuredUrl);
}

export function toAbsoluteUrl(input: string) {
  if (!input) return getDefaultOgImage();

  try {
    return new URL(input).toString();
  } catch {
    return new URL(input, `${getSiteUrl()}/`).toString();
  }
}

export function getDefaultOgImage() {
  return new URL(DEFAULT_OG_IMAGE_PATH, `${getSiteUrl()}/`).toString();
}

export function toOgLocale(locale?: string) {
  return locale === "en" ? "en_US" : "vi_VN";
}

export function getAlternateOgLocales(locale?: string) {
  return SUPPORTED_LOCALES.filter((item) => item !== locale).map((item) =>
    toOgLocale(item),
  );
}
