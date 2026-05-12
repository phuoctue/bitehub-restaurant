"use client";

import { getMenuItems } from "@/app/manage/menuItems";
import { useAppStore } from "@/components/app-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package2, Settings } from "lucide-react";

export default function NavLinks() {
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);
  const t = useTranslations("ManageCommon");
  const menuItems = getMenuItems(t);

  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">BiteHub</span>
          </Link>

          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            if (!item.roles?.includes(role as never)) return null;

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
                      {
                        "bg-accent text-accent-foreground": isActive,
                        "text-muted-foreground": !isActive
                      }
                    )}
                  >
                    <item.Icon className="h-5 w-5" />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/manage/setting"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
                  {
                    "bg-accent text-accent-foreground": pathname === "/manage/setting",
                    "text-muted-foreground": pathname !== "/manage/setting"
                  }
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">{t("settings")}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t("settings")}</TooltipContent>
          </Tooltip>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
