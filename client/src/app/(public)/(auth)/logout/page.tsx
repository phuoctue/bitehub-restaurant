"use client";
import { useAppStore } from "@/components/app-provider";
import {
  getRefreshTokenFromLocalStorage,
  getAccessTokenFromLocalStorage,
} from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, Suspense } from "react";

function LogoutContent() {
  const { mutateAsync } = useLogoutMutation();
  const router = useRouter();
  const  setRole = useAppStore(state => state.setRole);
  const disconnectSocket = useAppStore(state => state.disconnectSocket);
  const searchParams = useSearchParams();
  const refreshTokenFromUrl = searchParams.get("refreshToken");
  const accessTokenFromUrl = searchParams.get("accessToken");
  const processed = useRef(false);

  useEffect(() => {
    // Nếu đã xử lý rồi thì không chạy lại (tránh StrictMode chạy 2 lần)
    if (processed.current) return;

    const logout = async () => {
      processed.current = true;
      try {
        // Luôn gọi API logout để xóa cookie ở phía Server (Route Handler)
        await mutateAsync();
      } catch (error) {
        // Ngay cả khi API lỗi (ví dụ token đã hết hạn trên server)
        // Ta vẫn phải đảm bảo người dùng được logout ở client
      } finally {
        // Xóa sạch LocalStorage ở Client trước khi điều hướng
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Điều hướng về trang login
        // Dùng window.location.href để ép trình duyệt load lại hoàn toàn (đảm bảo xóa sạch cache/middleware state)
        // Hoặc router.push nếu bạn muốn nhanh hơn
        setRole();
        disconnectSocket()
        router.push("/login")
      }
    };

    // Chỉ thực hiện logout nếu thực sự có token hoặc đang từ middleware chuyển hướng sang
    if (
      refreshTokenFromUrl ||
      getRefreshTokenFromLocalStorage() ||
      getAccessTokenFromLocalStorage()
    ) {
      logout();
    } else {
      // Nếu không có bất kỳ token nào, quay về trang chủ hoặc login luôn
      router.push("/");
    }
  }, [
    mutateAsync,
    router,
    refreshTokenFromUrl,
    accessTokenFromUrl,
    setRole,
    disconnectSocket,
  ]);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Đang đăng xuất...</h1>
        <p className="text-muted-foreground animate-pulse">
          Vui lòng chờ trong giây lát
        </p>
      </div>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <LogoutContent />
    </Suspense>
  );
}
