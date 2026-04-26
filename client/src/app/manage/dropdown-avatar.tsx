"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLogoutMutation } from "@/queries/useAuth";
import { useRouter } from "next/navigation";
import { handleErrorApi } from "@/lib/utils";
import { useAccountMe } from "@/queries/useAccount";
import { useAppStore } from "@/components/app-provider";

export default function DropdownAvatar() {
  const logoutMutation = useLogoutMutation();
  const router = useRouter();
  const  setRole = useAppStore(state => state.setRole);
  const  disconnectSocket = useAppStore(state => state.disconnectSocket);

  // Lấy dữ liệu profile của user hiện tại
  const { data } = useAccountMe();
  const account = data?.payload.data;

  const logout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      setRole();
      disconnectSocket()
      router.push("/");
    } catch (error) {
      handleErrorApi({
        error,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Avatar>
            {/* Fix Bài 44: Chỉ truyền src nếu account?.avatar có giá trị thực sự. 
                Nếu rỗng hoặc null, AvatarImage sẽ không render lỗi 403 */}
            <AvatarImage
              src={account?.avatar ?? undefined}
              alt={account?.name}
              className="object-cover"
            />
            {/* Fix lỗi .slice() khi account?.name chưa có dữ liệu */}
            <AvatarFallback>
              {account?.name ? account.name.slice(0, 2).toUpperCase() : "AI"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{account?.name ?? "Người dùng"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={"/"} className="cursor-pointer w-full">
            Trang chủ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={"/manage/setting"} className="cursor-pointer w-full">
            Cài đặt
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">Hỗ trợ</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
