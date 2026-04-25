"use client";

import { useAppContext } from "@/components/app-provider";
import { decodeToken, generateSocketInstance } from "@/lib/utils"; // Thêm import hàm socket
import { useSetTokenToCookieMutation } from "@/queries/useAuth";
import { useSearchParams, useRouter } from "next/navigation"; // Dùng useRouter từ next/navigation
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function AuthPage() {
  const { mutateAsync } = useSetTokenToCookieMutation();
  const count = useRef(0);
  const { setRole, setSocket } = useAppContext();
  const searchParams = useSearchParams();
  const router = useRouter(); // Sử dụng hook useRouter



  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const message = searchParams.get("message");

  useEffect(() => {
    if (accessToken && refreshToken) {
      if (count.current === 0) {
        const { role } = decodeToken(accessToken);
        setRole(role);
        setSocket(generateSocketInstance(accessToken));

        // Lưu token vào localStorage/Cookie tùy logic dự án của bạn
        // setAccessTokenToLocalStorage(accessToken)
        // setRefreshTokenToLocalStorage(refreshToken)
        mutateAsync({ accessToken, refreshToken })
          .then(() => {
            router.push("/manage/dashboard");
          })
         count.current ++
      }
    } else if (message) {
      // Fix lỗi toast của Sonner: Truyền trực tiếp string hoặc object đúng định dạng
      toast.error(message || "Có lỗi xảy ra");
      router.push("/login");
    }
  }, [
    accessToken,
    refreshToken,
    setRole,
    router,
    setSocket,
    message,
    mutateAsync,
  ]);

  return <div>Đang xử lý đăng nhập...</div>;
}
