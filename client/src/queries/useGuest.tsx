import guestApiRequest from "@/apiRequest/guest";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const locale = useLocale();

  return useMutation({
    mutationFn: ({
      orders,
      clientSentAt,
    }: {
      orders: Parameters<typeof guestApiRequest.order>[0];
      clientSentAt?: number;
    }) => guestApiRequest.order(orders, { clientSentAt }),
    onSuccess: async (result) => {
      queryClient.setQueryData(["guest-orders", locale], (oldData: any) => {
        const existingOrders = oldData?.payload?.data ?? [];
        const createdOrders = result.payload?.data ?? [];

        return {
          ...result,
          payload: {
            ...result.payload,
            data: [...existingOrders, ...createdOrders],
          },
        };
      });

      await queryClient.invalidateQueries({
        queryKey: ["guest-orders"],
      });
    },
  });
};

export const useGuestGetOrderListQuery = () => {
  const locale = useLocale();
  return useQuery({
    queryFn: guestApiRequest.getOrderList,
    queryKey: ["guest-orders", locale],
    refetchOnMount: true,
  });
};
