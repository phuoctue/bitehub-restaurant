"use client";
import { useAppStore } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Role } from "@/constants/type";
import { withLocalePath } from "@/lib/locale-path";
import { cn, handleErrorApi } from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { RoleType } from "@/types/jwt.types";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type MenuItem = {
  title: string;
  href: string;
  role?: RoleType[];
  hideWhenLogin?: boolean;
};

export default function NavItems({ className }: { className?: string }) {
  const t = useTranslations("PublicNav");
  const role = useAppStore((state) => state.role);
  const setRole = useAppStore((state) => state.setRole);
  const disconnectSocket = useAppStore((state) => state.disconnectSocket);

  const menuItems: MenuItem[] = useMemo(
    () => [
      { title: t("home"), href: "/" },
      { title: t("menu"), href: "/guest/menu", role: [Role.Guest] },
      { title: t("orders"), href: "/guest/orders", role: [Role.Guest] },
      { title: t("login"), href: "/login", hideWhenLogin: true },
      { title: t("manage"), href: "/manage/dashboard", role: [Role.Owner, Role.Employee] }
    ],
    [t]
  );

  const logoutMutation = useLogoutMutation();
  const router = useRouter();

  const logout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      setRole();
      disconnectSocket();
      router.push(withLocalePath("/"));
      toast.success(t("logoutSuccess"));
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {menuItems.map((item) => {
        const isRoleAuthorized = item.role && role && item.role.includes(role);
        const isPublicVisible =
          item.role === undefined &&
          (!item.hideWhenLogin || (item.hideWhenLogin && !role));

        if (isRoleAuthorized || isPublicVisible) {
          return (
            <Link href={item.href} key={item.href} className={className}>
              {item.title}
            </Link>
          );
        }
        return null;
      })}
      {role && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className={cn(className, "cursor-pointer")}>{t("logout")}</div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logoutConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("logoutConfirmDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={logout}>OK</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
