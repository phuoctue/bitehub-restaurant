"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SUPPORTED_LOCALES = ["vi", "en"] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const changeLocale = (nextLocale: "vi" | "en") => {
    if (nextLocale === locale) return;

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;

    const query = searchParams.toString();
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as (typeof SUPPORTED_LOCALES)[number])) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }

    const localizedPath = `/${segments.join("/")}`;
    const targetPath = `${localizedPath}${query ? `?${query}` : ""}`;

    router.replace(targetPath);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 rounded-full px-3 font-semibold">
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLocale("vi")}>
          Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLocale("en")}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
