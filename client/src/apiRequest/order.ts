import {
  CreateOrdersBodyType,
  CreateOrdersResType,
  PayGuestOrdersBodyType,
  PayGuestOrdersResType,
} from "./../schemaValidations/order.schema";
import http from "@/lib/http";
import {
  GetOrderDetailResType,
  GetOrderInvoiceResType,
  GetOrdersQueryParamsType,
  GetOrdersResType,
  UpdateOrderBodyType,
  UpdateOrderResType,
} from "@/schemaValidations/order.schema";
import { toDate } from "date-fns";
import queryString from "query-string";
import { number } from "zod";

type TimingOptions = {
  clientSentAt?: number;
};

const orderApiRequest = {
  createOrders: (body: CreateOrdersBodyType, options?: TimingOptions) =>
    http.post<CreateOrdersResType>("/orders", body, {
      headers:
        options?.clientSentAt !== undefined
          ? {
              "x-client-sent-at": String(options.clientSentAt),
            }
          : undefined,
    }),
  getOrderList: (queryParams: GetOrdersQueryParamsType) =>
    http.get<GetOrdersResType>(
      "/orders?" +
        queryString.stringify({
          fromDate: queryParams.fromDate?.toISOString(),
          toDate: queryParams.toDate?.toISOString(),
        }),
    ),
  updateOrder: (
    orderId: number,
    body: UpdateOrderBodyType,
    options?: TimingOptions,
  ) =>
    http.put<UpdateOrderResType>(`/orders/${orderId}`, body, {
      headers:
        options?.clientSentAt !== undefined
          ? {
              "x-client-sent-at": String(options.clientSentAt),
            }
          : undefined,
    }),
  getOrderDetail: (orderId: number) =>
    http.get<GetOrderDetailResType>(`/orders/${orderId}`),
  getOrderInvoice: (orderId: number) =>
    http.get<GetOrderInvoiceResType>(`/orders/${orderId}/invoice`),
  payGuestOrders: (body: PayGuestOrdersBodyType, options?: TimingOptions) =>
    http.post<PayGuestOrdersResType>("/orders/pay", body, {
      headers:
        options?.clientSentAt !== undefined
          ? {
              "x-client-sent-at": String(options.clientSentAt),
            }
          : undefined,
    }),
  deleteOrder: (orderId: number) =>
    http.delete(`/orders/${orderId}`),
};

export default orderApiRequest;
