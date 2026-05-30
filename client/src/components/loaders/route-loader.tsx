"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const START_PROGRESS = 12;
const CAP_PROGRESS = 90;

function isValidNavigationTarget(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  if (
    anchor.getAttribute("rel")?.includes("external") ||
    anchor.dataset.noLoader === "true"
  ) {
    return false;
  }
  return true;
}

export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const pathKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams],
  );

  useEffect(() => {
    const tick = () => {
      setProgress((current) => {
        if (!isActive || current >= CAP_PROGRESS) return current;
        const delta = Math.max((CAP_PROGRESS - current) * 0.08, 0.4);
        return Math.min(current + delta, CAP_PROGRESS);
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    if (isActive) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    setProgress(100);
    const timeoutId = window.setTimeout(() => {
      setIsActive(false);
      setProgress(0);
    }, 160);

    return () => window.clearTimeout(timeoutId);
  }, [pathKey]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor || !isValidNavigationTarget(anchor)) return;

      const targetUrl = new URL(anchor.href, window.location.origin);
      if (targetUrl.origin !== window.location.origin) return;

      const currentPath = window.location.pathname + window.location.search;
      const nextPath = targetUrl.pathname + targetUrl.search;
      if (currentPath === nextPath) return;

      setProgress(START_PROGRESS);
      setIsActive(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-full transition-opacity duration-150",
        isActive || progress === 100 ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)] transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
