"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const RefreshToken = dynamic(() => import("./refresh-token"), { ssr: false });
const ListenLogoutSocket = dynamic(() => import("./listen-logout-socket"), {
  ssr: false,
});

export default function ClientRuntimeEffects() {
  return (
    <>
      <RefreshToken />
      <ListenLogoutSocket />
    </>
  );
}
