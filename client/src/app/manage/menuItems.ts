import { Role } from "@/constants/type";
import {
  Home,
  ShoppingCart,
  Users2,
  Salad,
  Table,
} from "lucide-react";

type MenuItem = {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: Array<(typeof Role)[keyof typeof Role]>;
};

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    Icon: Home,
    href: "/manage/dashboard",
    roles: [Role.Owner, Role.Employee]
  },
  {
    title: "Đơn hàng",
    Icon: ShoppingCart,
    href: "/manage/orders",
    roles: [Role.Owner, Role.Employee]

  },
  {
    title: "Bàn ăn",
    Icon: Table,
    href: "/manage/tables",
    roles: [Role.Owner, Role.Employee]

  },
  {
    title: "Món ăn",
    Icon: Salad,
    href: "/manage/dishes",
    roles: [Role.Owner, Role.Employee]
  },

  {
    title: "Nhân viên",
    Icon: Users2,
    href: "/manage/accounts",
    roles: [Role.Owner]
  },
];

export default menuItems;
