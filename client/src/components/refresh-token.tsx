"use client";

import { useAppStore } from "@/components/app-provider";
import {
  checkAndRefreshToken,
  decodeToken,
  generateSocketInstance,
  getAccessTokenFromLocalStorage,
} from "@/lib/utils";
import { extractLocaleFromPath, withLocalePath } from "@/lib/locale-path";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RefreshToken() {
  const pathName = usePathname();
  const router = useRouter();
  const socket = useAppStore((state) => state.socket);
  const setSocket = useAppStore((state) => state.setSocket);
  const localePrefix = extractLocaleFromPath(pathName);
  const normalizedPathName = localePrefix
    ? pathName.slice(localePrefix.length + 1) || "/"
    : pathName;
  const isManagePath = normalizedPathName.startsWith("/manage");
  const isGuestPath = normalizedPathName.startsWith("/guest");

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isActive = true;

    const ensureSocket = async () => {
      if (socket) return socket;
      const accessToken = getAccessTokenFromLocalStorage();
      if (!accessToken) return null;
      const nextSocket = await generateSocketInstance(accessToken);
      if (isActive) {
        setSocket(nextSocket);
      } else {
        nextSocket.disconnect();
      }
      return nextSocket;
    };

    const syncSocketAuthAndConnect = async () => {
      const resolvedSocket = await ensureSocket();
      if (!resolvedSocket) return;
      const accessToken = getAccessTokenFromLocalStorage();
      if (!accessToken) return;

      resolvedSocket.auth = {
        ...resolvedSocket.auth,
        Authorization: `Bearer ${accessToken}`,
      };

      if (!resolvedSocket.connected) {
        resolvedSocket.connect();
      }
    };

    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        force,
        onSuccess: async () => {
          await syncSocketAuthAndConnect();
          const resolvedSocket = await ensureSocket();
          if (force && resolvedSocket?.connected) {
            resolvedSocket.disconnect();
            resolvedSocket.connect();
          }
        },
        onError: () => {
          if (intervalId) {
            clearInterval(intervalId);
          }
          if (isManagePath || isGuestPath) {
            router.push(withLocalePath(isGuestPath ? "/" : "/login", pathName));
          }
        },
      });
    };

    syncSocketAuthAndConnect();
    // Không force refresh ngay lập tức khi vừa vào page
    // Chỉ refresh khi token gần hết hạn (do interval kiểm tra mỗi 5s)

    const TIMEOUT = 5000;
    intervalId = setInterval(() => onRefreshToken(), TIMEOUT);

    function onConnect() {
      console.log("socket connected");
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

    ensureSocket().then((resolvedSocket) => {
      if (!resolvedSocket) return;
      if (resolvedSocket.connected) {
        onConnect();
      }
      resolvedSocket.on("connect", onConnect);
      resolvedSocket.on("disconnect", onDisconnect);
      resolvedSocket.on("refresh-token", onRefreshTokenSocket);
    });

    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("refresh-token", onRefreshTokenSocket);
    };
  }, [isGuestPath, isManagePath, pathName, router, setSocket, socket]);

  return null;
}
