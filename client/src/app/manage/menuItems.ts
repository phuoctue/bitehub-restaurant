import { Role } from "@/constants/type";
import { Home, Salad, ShoppingCart, Table, Users2 } from "lucide-react";

type MenuItem = {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: Array<(typeof Role)[keyof typeof Role]>;
};

export function getMenuItems(t: (key: string) => string): MenuItem[] {
  return [
    {
      title: t("dashboard"),
      Icon: Home,
      href: "/manage/dashboard",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: t("orders"),
      Icon: ShoppingCart,
      href: "/manage/orders",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: t("tables"),
      Icon: Table,
      href: "/manage/tables",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: t("dishes"),
      Icon: Salad,
      href: "/manage/dishes",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: t("employees"),
      Icon: Users2,
      href: "/manage/accounts",
      roles: [Role.Owner]
    }
  ];
}
