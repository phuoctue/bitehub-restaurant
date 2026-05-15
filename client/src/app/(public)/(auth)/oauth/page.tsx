"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/components/app-provider";
import { withLocalePath } from "@/lib/locale-path";
import { decodeToken, generateSocketInstance } from "@/lib/utils";
import { useSetTokenToCookieMutation } from "@/queries/useAuth";

export default function AuthPage() {
  const { mutateAsync } = useSetTokenToCookieMutation();
  const count = useRef(0);
  const setRole = useAppStore((state) => state.setRole);
  const setSocket = useAppStore((state) => state.setSocket);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const message = searchParams.get("message");

  useEffect(() => {
    if (accessToken && refreshToken) {
      if (count.current === 0) {
        const { role } = decodeToken(accessToken);
        setRole(role);
        generateSocketInstance(accessToken).then((nextSocket) => {
          setSocket(nextSocket);
        });

        mutateAsync({ accessToken, refreshToken }).then(() => {
          router.push(withLocalePath("/manage/dashboard", pathname));
        });
        count.current++;
      }
      return;
    }

    if (message) {
      toast.error(message || "Co loi xay ra");
      router.push(withLocalePath("/login", pathname));
    }
  }, [
    accessToken,
    message,
    mutateAsync,
    pathname,
    refreshToken,
    router,
    setRole,
    setSocket,
  ]);

  return <div>Dang xu ly dang nhap...</div>;
}
