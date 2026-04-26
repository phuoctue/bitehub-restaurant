"use client";

import socket from "@/lib/socket";
import {
  checkAndRefreshToken,
  decodeToken,
  getAccessTokenFromLocalStorage,
} from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "./app-provider";
import { on } from "events";

//Những page kh check refreshToken
const UNAUTHENTICATED_PATH = ["/", "/login", "/logout", "/refresh-token"];

export default function RefreshToken() {
  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathName)) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const syncSocketAuthAndConnect = () => {
      const accessToken = getAccessTokenFromLocalStorage();
      if (!accessToken) return;

      socket.auth = {
        ...socket.auth,
        Authorization: `Bearer ${accessToken}`,
      };

      if (!socket.connected) {
        socket.connect();
      }
    };

    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        force,
        onSuccess: () => {
          syncSocketAuthAndConnect();
          if (force && socket.connected) {
            socket.disconnect();
            socket.connect();
          }
        },
        onError: () => {
          if (intervalId) {
            clearInterval(intervalId);
          }
          router.push("/login");
        },
      });
    };

    // Gọi force refresh ngay lần đầu để đồng bộ token tức thì.
    syncSocketAuthAndConnect();
    onRefreshToken(true);

    //TImeout interval phải bé hơn thời gian hết hạn của access token
    //vd time hết hạn của access token là 10s thì cứ 1s sẽ cho check 1 lần
    const TIMEOUT = 1000;
    intervalId = setInterval(() => onRefreshToken(), TIMEOUT);

    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      console.log(socket.id);
    }

    function onDisconnect() {
      console.log("disconnect");
    }

    const onRefreshTokenSocket = (data?: { accountId?: number }) => {
      if (data?.accountId) {
        const accessToken = getAccessTokenFromLocalStorage();
        if (!accessToken) return;
        const decoded = decodeToken(accessToken);
        if (decoded.userId !== data.accountId) return;
      }
      onRefreshToken(true);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("refresh-token", onRefreshTokenSocket);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("refresh-token", onRefreshTokenSocket);
    };
  }, [pathName, router]);

  return null;
}
