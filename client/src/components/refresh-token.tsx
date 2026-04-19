"use client";

import { checkAndRefreshToken } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppContext } from "./app-provider";
import { on } from "events";

//Những page kh check refreshToken
const UNAUTHENTICATED_PATH = ["/", "/login", "/logout", "/refresh-token"];

export default function RefreshToken() {
  const pathName = usePathname();
  const router = useRouter();
  const { socket, disconnectSocket } = useAppContext();
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathName)) return;
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) return;
    let interval: any = null;
    console.log(refreshToken);
    const onRefreshTokenError = () => {
      clearInterval(interval);
      disconnectSocket()
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

    if (socket?.connected) {
      onConnect();
    }

    function onConnect() {
      console.log(socket?.id);
    }

    function onDisconnect() {
      console.log("Disconnect");
    }

    function onRefreshTokenSocket() {
      checkAndRefreshToken({
        onError: onRefreshTokenError,
      });
    }

    socket?.on("connect", onConnect);
    socket?.on("disconnect", onDisconnect);
    socket?.on("refresh-token", onRefreshTokenSocket);

    return () => {
      clearInterval(interval);
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("refresh-token", onRefreshTokenSocket);
    };
  }, [pathName, router, socket, disconnectSocket]);
  return null;
}
