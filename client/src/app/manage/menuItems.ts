import { Role } from "@/constants/type";
import { Home, Salad, ShoppingCart, Table, Users2 } from "lucide-react";

export type ManageCommonLabels = {
  dashboard: string;
  orders: string;
  tables: string;
  dishes: string;
  employees: string;
  settings: string;
  support: string;
  logout: string;
  home: string;
  user: string;
  toggleMenu: string;
};

type MenuItem = {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: Array<(typeof Role)[keyof typeof Role]>;
};

export function getMenuItems(labels: Pick<ManageCommonLabels, "dashboard" | "orders" | "tables" | "dishes" | "employees">): MenuItem[] {
  return [
    {
      title: labels.dashboard,
      Icon: Home,
      href: "/manage/dashboard",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: labels.orders,
      Icon: ShoppingCart,
      href: "/manage/orders",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: labels.tables,
      Icon: Table,
      href: "/manage/tables",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: labels.dishes,
      Icon: Salad,
      href: "/manage/dishes",
      roles: [Role.Owner, Role.Employee]
    },
    {
      title: labels.employees,
      Icon: Users2,
      href: "/manage/accounts",
      roles: [Role.Owner]
    }
  ];
}
