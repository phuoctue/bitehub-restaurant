"use client";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  decodeToken,
  generateSocketInstance,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage,
} from "@/lib/utils";
import { RoleType } from "@/types/jwt.types";
import type { Socket } from "socket.io-client";
import { create } from "zustand";
import dynamic from "next/dynamic";

type SocketTimingMeta = {
  clientSentAt?: number;
  serverReceivedAt?: number;
  serverEmittedAt?: number;
};

const logSocketTiming = (eventName: string, meta?: SocketTimingMeta) => {
  if (!meta) return;

  const receivedAt = Date.now();
  const serverToClientDelta =
    meta.serverEmittedAt !== undefined
      ? receivedAt - meta.serverEmittedAt
      : undefined;
  const clientToServerDelta =
    meta.clientSentAt !== undefined && meta.serverReceivedAt !== undefined
      ? meta.serverReceivedAt - meta.clientSentAt
      : undefined;
  const endToEndDelta =
    meta.clientSentAt !== undefined ? receivedAt - meta.clientSentAt : undefined;

  const rows = [
    {
      metric: "receivedAt",
      value: receivedAt,
      human: new Date(receivedAt).toLocaleTimeString(),
    },
    ...(meta.clientSentAt !== undefined
      ? [
          {
            metric: "clientSentAt",
            value: meta.clientSentAt,
            human: new Date(meta.clientSentAt).toLocaleTimeString(),
          },
        ]
      : []),
    ...(meta.serverReceivedAt !== undefined
      ? [
          {
            metric: "serverReceivedAt",
            value: meta.serverReceivedAt,
            human: new Date(meta.serverReceivedAt).toLocaleTimeString(),
          },
        ]
      : []),
    ...(meta.serverEmittedAt !== undefined
      ? [
          {
            metric: "serverEmittedAt",
            value: meta.serverEmittedAt,
            human: new Date(meta.serverEmittedAt).toLocaleTimeString(),
          },
        ]
      : []),
    ...(clientToServerDelta !== undefined
      ? [{ metric: "client -> server delta", value: `${clientToServerDelta} ms` }]
      : []),
    ...(serverToClientDelta !== undefined
      ? [{ metric: "server -> client delta", value: `${serverToClientDelta} ms` }]
      : []),
    ...(endToEndDelta !== undefined
      ? [{ metric: "end-to-end delta", value: `${endToEndDelta} ms` }]
      : []),
  ];

  console.groupCollapsed(`[realtime][${eventName}] timing`);
  console.table(rows);
  console.groupEnd();
};

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (module) => module.ReactQueryDevtools,
    ),
  { ssr: false },
);
const ClientRuntimeEffects = dynamic(() => import("./client-runtime-effects"), {
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

function SocketQueryInvalidator() {
  const socket = useAppStore((state) => state.socket);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const refreshTables = (_payload?: unknown, meta?: SocketTimingMeta) => {
      logSocketTiming("table-update", meta);
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    };

    const refreshOrdersAndTables = (
      eventName: "new-order" | "update-order",
      _payload?: unknown,
      meta?: SocketTimingMeta,
    ) => {
      logSocketTiming(eventName, meta);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    };

    const refreshPaymentData = (
      _payload?: unknown,
      meta?: SocketTimingMeta,
    ) => {
      logSocketTiming("payment", meta);
      queryClient.invalidateQueries({ queryKey: ["dashboardIndicators"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    };

    const onNewOrder = (payload?: unknown, meta?: SocketTimingMeta) =>
      refreshOrdersAndTables("new-order", payload, meta);
    const onUpdateOrder = (payload?: unknown, meta?: SocketTimingMeta) =>
      refreshOrdersAndTables("update-order", payload, meta);

    socket.on("table-update", refreshTables);
    socket.on("new-order", onNewOrder);
    socket.on("update-order", onUpdateOrder);
    socket.on("payment", refreshPaymentData);

    return () => {
      socket.off("table-update", refreshTables);
      socket.off("new-order", onNewOrder);
      socket.off("update-order", onUpdateOrder);
      socket.off("payment", refreshPaymentData);
    };
  }, [queryClient, socket]);

  return null;
}

// const AppContext = createContext({
//   isAuth: false,
//   role: undefined as RoleType | undefined,
//   setRole: (role?: RoleType | undefined) => {},
//   socket: undefined as Socket | undefined,
//   setSocket: (socket?: Socket | undefined) => {},
//   disconnectSocket: () => {},
// });
type appStoreType = {
  isAuth: boolean;
  role: RoleType | undefined;
  setRole: (role?: RoleType | undefined) => void;
  socket: Socket | undefined;
  setSocket: (socket?: Socket | undefined) => void;
  disconnectSocket: () => void;
};

export const useAppStore = create<appStoreType>((set) => ({
  isAuth: false,
  role: undefined as RoleType | undefined,
  setRole: (role?: RoleType | undefined) => {
    set({ role, isAuth: Boolean(role) });
    if (!role) {
      removeTokensFromLocalStorage();
    }
  },
  socket: undefined as Socket | undefined,
  setSocket: (socket?: Socket | undefined) => set({ socket }),
  disconnectSocket: () =>
    set((state) => {
    state.socket?.disconnect();
      return { socket: undefined };
    }),
}));

// export const useContext = () => {
//   return useContext(AppContext);
// };
export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setRole = useAppStore((state) => state.setRole);
  const setSocket = useAppStore((state) => state.setSocket);



  // const [socket, setSocket] = useState<Socket | undefined>();
  // const [role, setRoleState] = useState<RoleType | undefined>();
  const count = useRef(0);
  useEffect(() => {
    if (count.current == 0) {
      const accessToken = getAccessTokenFromLocalStorage();
      if (accessToken) {
        const role = decodeToken(accessToken).role;
        setRole(role);
        generateSocketInstance(accessToken).then((nextSocket) => {
          setSocket(nextSocket);
        });
      }
      count.current++;
    }
  }, [setRole, setSocket]);

  // const disconnectSocket = useCallback(() => {
  //   socket?.disconnect();
  //   setSocket(undefined);
  // }, [socket, setSocket]);

  // const setRole = (role?: RoleType | undefined) => {
  //   setRoleState(role);
  //   if (!role) {
  //     removeTokensFromLocalStorage();
  //   }
  // };

  // const isAuth = Boolean(role);
  return (
    // <AppContext value={{ role, setRole, isAuth, socket, setSocket, disconnectSocket }}>
      <QueryClientProvider client={queryClient}>
        <SocketQueryInvalidator />
        {children}
        <ClientRuntimeEffects />
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    // </AppContext>
  )
}
