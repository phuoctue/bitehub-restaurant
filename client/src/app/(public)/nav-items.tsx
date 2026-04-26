"use client";
import { useAppStore } from "@/components/app-provider";
import { Role } from "@/constants/type";
import { cn, handleErrorApi } from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { RoleType } from "@/types/jwt.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const menuItems: {
  title: string;
  href: string;
  authRequired?: boolean;
  role?: RoleType[];
  hideWhenLogin?: boolean;
}[] = [
  {
    title: "Trang chủ",
    href: "/",
  },
  {
    title: "Menu",
    href: "/guest/menu",
    role: [Role.Guest],
  },
  {
    title: "Đơn hàng",
    href: "/guest/orders",
    role: [Role.Guest],
  },
  {
    title: "Đăng nhập",
    href: "/login",
    hideWhenLogin: true,
  },
  {
    title: "Quản lý",
    href: "/manage/dashboard",
    role: [Role.Owner, Role.Employee],
  },
];

//Server: món ăn, đăng nhập, đơn hàng.Do server không biết trang thái login của user
//Client: đầu tiền client sẽ hiển thị món ăn, đăng nhập. Nhưng ngay sau đó thì client render ra là món ăn, đơn hàng, quản lý
//do đã check đc trạng thái đăng nhập

export default function NavItems({ className }: { className?: string }) {
  const role = useAppStore(state => state.role);
  const  setRole = useAppStore(state => state.setRole);
  const disconnectSocket = useAppStore(state => state.disconnectSocket);

  const logoutMutation = useLogoutMutation();
  const router = useRouter();
  const logout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      setRole();
      disconnectSocket();
      router.push("/");
      toast.success("Đăng xuất thành công");
    } catch (error) {
      handleErrorApi({
        error,
      });
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
        // Trường hợp menu item yêu cầu role cụ thể
        const isRoleAuthorized = item.role && role && item.role.includes(role);
        // Trường hợp menu item không yêu cầu role (public)
        // Nếu hideWhenLogin = true thì chỉ hiện khi CHƯA login (không có role)
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
            <div className={cn(className, "cursor-pointer")}>Đăng xuất</div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có muốn đăng xuất không?</AlertDialogTitle>
              <AlertDialogDescription>
                Việc đăng xuất có thể làm mất đi hóa đơn của bạn
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Thoát</AlertDialogCancel>
              <AlertDialogAction onClick={logout}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
