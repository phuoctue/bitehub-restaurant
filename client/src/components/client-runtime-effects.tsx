"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const RefreshToken = dynamic(() => import("./refresh-token"), { ssr: false });
const ListenLogoutSocket = dynamic(() => import("./listen-logout-socket"), {
  ssr: false,
});

const AUTH_PATH_PATTERN = /^\/(?:[a-z]{2}\/)?(?:manage|guest)(?:\/|$)/i;

export default function ClientRuntimeEffects() {
  const pathname = usePathname();

  if (!AUTH_PATH_PATTERN.test(pathname)) {
    return null;
  }

  return (
    <>
      <RefreshToken />
      <ListenLogoutSocket />
    </>
  );
}
