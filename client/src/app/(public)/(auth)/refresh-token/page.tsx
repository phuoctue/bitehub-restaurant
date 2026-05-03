"use client";
import {
  getRefreshTokenFromLocalStorage,
  checkAndRefreshToken,
} from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense } from "react";

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
        force: true,
        onSuccess: () => {
          router.push(redirectPathName || "/");
        },
        onError: () => {
          router.push("/login");
        },
      });
    } else {
      router.push("/");
    }
  }, [router, refreshTokenFromUrl, redirectPathName]);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Refresh token...</h1>
        <p className="text-muted-foreground animate-pulse">
          Vui long cho trong giay lat
        </p>
      </div>
    </div>
  );
}

export default function RefreshTokenScreen() {
  return (
    <Suspense fallback={<div>Dang tai...</div>}>
      <RefreshTokenPage />
    </Suspense>
  );
}
