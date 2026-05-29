"use client";
import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { useGuestGetOrderListQuery } from "@/queries/useGuest";
import { OrderStatus } from "@/constants/type";
import { Badge } from "@/components/ui/badge";

import {
  PayGuestOrdersResType,
  UpdateOrderResType,
} from "@/schemaValidations/order.schema";
import { toast } from "sonner";
import { useAppStore } from "@/components/app-provider";
import { useTranslations } from "next-intl";

export default function OrdersCart() {
  const t = useTranslations("GuestOrders");
  const { data, refetch } = useGuestGetOrderListQuery();
  const orders = useMemo(() => data?.payload.data ?? [], [data]);
  const socket = useAppStore((state) => state.socket);

  const { totalPrice, totalQuantity } = useMemo(() => {
    return orders.reduce(
      (total, order) => {
        if (
          order.status === OrderStatus.Paid ||
          order.status === OrderStatus.Rejected
        ) {
          return total;
        }
        return {
          totalPrice:
            total.totalPrice + order.dishSnapshot.price * order.quantity,
          totalQuantity: total.totalQuantity + order.quantity,
        };
      },
      { totalPrice: 0, totalQuantity: 0 },
    );
  }, [orders]);

  useEffect(() => {
    function onConnect() {
      console.log(socket?.id);
    }

    function onDisconnect() {
      console.log("disconnect");
    }

    function onUpdateOrder(data: UpdateOrderResType["data"]) {
      const {
        dishSnapshot: { name },
      } = data;
      toast.success(
        t("toastOrderUpdated", {
          dish: name,
          quantity: data.quantity,
          status: t(`status.${data.status}`),
        }),
      );
      refetch();
    }

    function onPayment(data: PayGuestOrdersResType["data"]) {
      const { guest } = data[0];
      toast.success(
        t("toastPayment", {
          guest: guest?.name ?? "",
          table: guest?.tableNumber ?? "",
          count: data.length,
        }),
      );
      refetch();
    }

    if (socket?.connected) {
      onConnect();
    }

    socket?.on("update-order", onUpdateOrder);
    socket?.on("connect", onConnect);
    socket?.on("disconnect", onDisconnect);
    socket?.on("payment", onPayment);

    return () => {
      socket?.off("update-order", onUpdateOrder);
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("payment", onPayment);
    };
  }, [refetch, socket, t]);

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-4 p-2 rounded-lg border border-transparent hover:border-muted transition-all"
          >
            <div className="flex-shrink-0 relative">
              <Image
                src={order.dishSnapshot.image}
                alt={order.dishSnapshot.name}
                height={100}
                width={100}
                quality={100}
                className="object-cover w-[80px] h-[80px] rounded-lg shadow-sm"
              />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <h3 className="text-sm font-medium truncate">
                {order.dishSnapshot.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {order.dishSnapshot.description}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(order.dishSnapshot.price)}
                </p>
                <span className="text-xs text-muted-foreground font-medium">
                  x {order.quantity}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <Badge
                variant={
                  order.status === OrderStatus.Pending
                    ? "secondary"
                    : order.status === OrderStatus.Processing
                      ? "default"
                      : order.status === OrderStatus.Rejected
                        ? "destructive"
                        : order.status === OrderStatus.Delivered
                          ? "default"
                          : "outline"
                }
                className="text-[10px] px-2 py-0"
              >
                {t(`status.${order.status}`)}
              </Badge>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            {t("empty")}
          </div>
        )}
      </div>
      {totalPrice > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[368px]">
          <div className="w-full h-12 shadow-lg rounded-full px-6 flex justify-between items-center bg-primary text-primary-foreground transition-all">
            <span className="font-medium text-sm">
              {t("total", { count: totalQuantity })}
            </span>
            <span className="font-bold text-lg">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
