"use client";

import { getMenuItems } from "@/app/manage/menuItems";
import { useAppStore } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Package2, PanelLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";


export default function MobileNavLinks() {
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);
  const t = useTranslations("ManageCommon");
  const menuItems = getMenuItems(t);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">{t("toggleMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <div className="sr-only">
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span>BiteHub</span>
          </div>
          <Link
            href="/"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">BiteHub</span>
          </Link>
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            if (!item.roles?.includes(role as never)) return null;
            const link = (
              <Link
                href={item.href}
                className={cn("flex items-center gap-4 px-2.5 hover:text-foreground", {
                  "text-foreground": isActive,
                  "text-muted-foreground": !isActive
                })}
              >
                <item.Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
            return (
              <SheetClose asChild key={item.href}>
                {link}
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
