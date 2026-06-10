"use client";

import { useAppStore } from "@/components/app-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { handleErrorApi } from "@/lib/utils";
import { useAccountMe } from "@/queries/useAccount";
import { useLogoutMutation } from "@/queries/useAuth";
import { Link, useRouter } from "@/i18n/navigation";
import type { ManageCommonLabels } from "@/app/manage/menuItems";


export default function DropdownAvatar({ labels }: { labels: ManageCommonLabels }) {
  const logoutMutation = useLogoutMutation();
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  const disconnectSocket = useAppStore((state) => state.disconnectSocket);

  const { data } = useAccountMe();
  const account = data?.payload.data;

  const logout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      setRole();
      disconnectSocket();
      router.push("/");
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
          <Avatar>
            <AvatarImage src={account?.avatar ?? undefined} alt={account?.name} className="object-cover" />
            <AvatarFallback>{account?.name ? account.name.slice(0, 2).toUpperCase() : "AI"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{account?.name ?? labels.user}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/" className="w-full cursor-pointer">
            {labels.home}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/manage/setting" className="w-full cursor-pointer">
            {labels.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">{labels.support}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {labels.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
