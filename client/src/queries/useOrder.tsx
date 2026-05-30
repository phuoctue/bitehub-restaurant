import orderApiRequest from "@/apiRequest/order";
import GuestsDialog from "@/app/manage/orders/guests-dialog";
import {
  GetOrdersQueryParamsType,
  PayGuestOrdersBody,
  PayGuestOrdersBodyType,
  PayGuestOrdersRes,
  UpdateOrderBodyType,
} from "@/schemaValidations/order.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useUpdateOrderMutation = () => {
  return useMutation({
    mutationFn: ({
      orderId,
      ...body
    }: UpdateOrderBodyType & { orderId: number }) =>
      orderApiRequest.updateOrder(orderId, body),
  });
};

export const useGetOrderListQuery = (queryParams: GetOrdersQueryParamsType, enabled: boolean = true) => {
  const fromDate = queryParams.fromDate?.toISOString() ?? "";
  const toDate = queryParams.toDate?.toISOString() ?? "";
  return useQuery({
    queryFn: () => orderApiRequest.getOrderList(queryParams),
    queryKey: ["orders", fromDate, toDate],
    enabled,
  });
};

export const useGetOrderDetailQuery = ({
  id,
  enabled,
}: {
  id: number;
  enabled: boolean;
}) => {
  return useQuery({
    queryFn: () => orderApiRequest.getOrderDetail(id),
    queryKey: ["orders", id],
    enabled,
  });
};

export const usePayForGuestMuattion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (body: PayGuestOrdersBodyType) =>
      orderApiRequest.payGuestOrders(body),
    onSuccess: async () => {
      // Invalidate dashboard indicators so it refreshes in real-time
      await queryClient.invalidateQueries({
        queryKey: ["dashboardIndicators"],
      });
      // Invalidate all orders queries
      await queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
      // Invalidate tables to update serving status
      await queryClient.invalidateQueries({
        queryKey: ["tables"],
      });
    },
  });
};

export const useCreateOrderMutation = () => {
  return useMutation({
    mutationFn: orderApiRequest.createOrders,
  });
};
