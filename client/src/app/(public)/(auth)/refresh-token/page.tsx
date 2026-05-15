"use client";
import authApiRequest from "@/apiRequest/auth";
import { withLocalePath } from "@/lib/locale-path";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense } from "react";

function RefreshTokenPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectPathName = searchParams.get("redirect");

  useEffect(() => {
    let cancelled = false;

    const refreshAndRedirect = async () => {
      try {
        // Refresh through Next API route so server cookie and client localStorage stay in sync.
        await authApiRequest.refreshToken();
        if (cancelled) return;
        router.replace(withLocalePath(redirectPathName || "/", pathname));
      } catch {
        if (cancelled) return;
        router.replace(withLocalePath("/login?clearTokens=1", pathname));
      }
    };

    refreshAndRedirect();
    return () => {
      cancelled = true;
    };
  }, [pathname, redirectPathName, router]);

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
