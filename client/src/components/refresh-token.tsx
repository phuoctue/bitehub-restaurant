"use client";

import { checkAndRefreshToken } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

//Những page kh check refreshToken
const UNAUTHENTICATED_PATH = ["/", "/login", "/logout", "/refresh-token"];

export default function RefreshToken() {
  const pathName = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathName)) return;
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) return;
    let interval: any = null;

    const onRefreshTokenError = () => {
      clearInterval(interval);
      // Xóa sạch token ở LocalStorage để tránh loop
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login"); // Chuyển hướng ngay lập tức
    };

    //Phải call lan đầu, vì interval sẽ chạy sau thoi gian TIMEOUT
    checkAndRefreshToken({
      onError: onRefreshTokenError,
    });
    //TImeout interval phải bé hơn thời gian hết hạn của access token
    //vd time hết hạn của access token là 10s thì cứ 1s sẽ cho check 1 lần
    const TIMEOUT = 1000;
    interval = setInterval(
      () =>
        checkAndRefreshToken({
          onError: onRefreshTokenError,
        }),
      TIMEOUT,
    );
    return () => clearInterval(interval);
  }, [pathName, router]);
  return null;
}
