"use client";
import {
  getRefreshTokenFromLocalStorage,
  getAccessTokenFromLocalStorage,
  checkAndRefreshToken,
} from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, Suspense } from "react";

function RefreshTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refreshTokenFromUrl = searchParams.get("refreshToken");
  const redirectPathName = searchParams.get("redirect");

  useEffect(() => {
    if (
      refreshTokenFromUrl &&
      refreshTokenFromUrl === getRefreshTokenFromLocalStorage()
    ) {
      checkAndRefreshToken({
        onSuccess: () => {
          router.push(redirectPathName || "/");
        },
        onError: () => {
          router.push("/login");
        },
      });
    } else {
      router.push("/"); // Nếu URL không có token hoặc không khớp thì về login luôn
    }
  }, [router, refreshTokenFromUrl, redirectPathName]);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Refresh token...</h1>
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
      <RefreshTokenPage />
    </Suspense>
  );
}
