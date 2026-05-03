"use client";

import socket from "@/lib/socket";
import {
  checkAndRefreshToken,
  decodeToken,
  getAccessTokenFromLocalStorage,
} from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const AUTH_REQUIRED_PREFIXES = ["/manage", "/guest"];

export default function RefreshToken() {
  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    const shouldRefreshToken = AUTH_REQUIRED_PREFIXES.some((path) =>
      pathName.startsWith(path),
    );

    if (!shouldRefreshToken) return;

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

    syncSocketAuthAndConnect();
    onRefreshToken(true);

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
