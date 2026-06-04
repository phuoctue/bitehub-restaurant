import guestApiRequest from "@/apiRequest/guest";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

export const useGuestLoginMutation = () => {
  return useMutation({
    mutationFn: guestApiRequest.login,
  });
};

export const useGuestLogoutMutation = () => {
  return useMutation({
    mutationFn: guestApiRequest.logout,
  });
};

export const useGuestOrderMuatation = () => {
  return useMutation({
    mutationFn: ({
      orders,
      clientSentAt,
    }: {
      orders: Parameters<typeof guestApiRequest.order>[0];
      clientSentAt?: number;
    }) => guestApiRequest.order(orders, { clientSentAt }),
  });
};

export const useGuestGetOrderListQuery = () => {
  const locale = useLocale();
  return useQuery({
    queryFn: guestApiRequest.getOrderList,
    queryKey: ["guest-orders", locale],
  });
};
