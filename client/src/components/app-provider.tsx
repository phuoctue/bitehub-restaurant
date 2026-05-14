"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
        setSocket(generateSocketInstance(accessToken));
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
        {children}
        <ClientRuntimeEffects />
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    // </AppContext>
  )
}
