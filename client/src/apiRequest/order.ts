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

const orderApiRequest = {
  createOrders: (body: CreateOrdersBodyType) =>
    http.post<CreateOrdersResType>("/orders", body),
  getOrderList: (queryParams: GetOrdersQueryParamsType) =>
    http.get<GetOrdersResType>(
      "/orders?" +
        queryString.stringify({
          fromDate: queryParams.fromDate?.toISOString(),
          toDate: queryParams.toDate?.toISOString(),
        }),
    ),
  updateOrder: (orderId: number, body: UpdateOrderBodyType) =>
    http.put<UpdateOrderResType>(`/orders/${orderId}`, body),
  getOrderDetail: (orderId: number) =>
    http.get<GetOrderDetailResType>(`/orders/${orderId}`),
  getOrderInvoice: (orderId: number) =>
    http.get<GetOrderInvoiceResType>(`/orders/${orderId}/invoice`),
  payGuestOrders: (body: PayGuestOrdersBodyType) =>
    http.post<PayGuestOrdersResType>("/orders/pay", body),
};

export default orderApiRequest;
