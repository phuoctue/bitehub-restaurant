import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatus, OrderStatusValues } from "@/constants/type";
import {
  OrderStatusIcon,
  formatCurrency,
  formatDateTimeToLocaleString,
  formatDateTimeToTimeString,
  handleErrorApi,
} from "@/lib/utils";
import { invoiceApiRequest } from "@/apiRequest/invoice";
import orderApiRequest from "@/apiRequest/order";
import { usePayForGuestMuattion } from "@/queries/useOrder";
import { GetOrdersResType } from "@/schemaValidations/order.schema";
import Image from "next/image";
import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

type Guest = GetOrdersResType["data"][0]["guest"];
type Orders = GetOrdersResType["data"];

export default function OrderGuestDetail({ guest, orders, onOrderDeleted }: { guest: Guest; orders: Orders; onOrderDeleted?: () => void }) {
  const t = useTranslations("ManageOrders");
  const statusLabel = (status: (typeof OrderStatusValues)[number]) => t(`status.${status}`);
  const [deletingOrderIds, setDeletingOrderIds] = useState<Set<number>>(new Set());
  const [deletedOrderIds, setDeletedOrderIds] = useState<Set<number>>(new Set());

  // Filter out deleted orders
  const visibleOrders = orders.filter((order) => !deletedOrderIds.has(order.id));

  const ordersFilterToPurchase = guest ? visibleOrders.filter((order) => order.status !== OrderStatus.Paid && order.status !== OrderStatus.Rejected) : [];
  const purchasedOrderFilter = guest ? visibleOrders.filter((order) => order.status === OrderStatus.Paid) : [];
  const payForGuestMutation = usePayForGuestMuattion();

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(t("confirmDelete") || "Bạn có chắc chắn muốn xóa đơn hàng này?")) {
      return;
    }
    
    try {
      setDeletingOrderIds((prev) => new Set([...prev, orderId]));
      await orderApiRequest.deleteOrder(orderId);
      // Remove from visible orders and close dialog after a short delay
      setDeletedOrderIds((prev) => new Set([...prev, orderId]));
      setDeletingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      // Trigger callback to refresh parent component or close dialog
      if (visibleOrders.length === 1 && onOrderDeleted) {
        setTimeout(() => {
          onOrderDeleted();
        }, 300);
      }
    } catch (error) {
      setDeletingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      handleErrorApi({ error });
    }
  };

  const pay = async () => {
    if (payForGuestMutation.isPending || !guest) return;
    const printPopup = invoiceApiRequest.openPrintWindow();
    try {
      const clientSentAt = Date.now();
      const result = await payForGuestMutation.mutateAsync({
        guestId: guest.id,
        clientSentAt,
      });

      const invoiceUrlFromPay = result.payload.invoice?.invoiceUrl;
      if (invoiceUrlFromPay) {
        invoiceApiRequest.printInvoice(invoiceUrlFromPay, printPopup);
        return;
      }

      const paidOrders = result.payload.data;
      if (paidOrders.length > 0) {
        const invoiceResult = await orderApiRequest.getOrderInvoice(paidOrders[0].id);
        invoiceApiRequest.printInvoice(invoiceResult.payload.data.invoiceUrl, printPopup);
        return;
      }
    } catch (error) {
      handleErrorApi({ error });
      printPopup?.close();
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {guest && (
        <Fragment>
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="grid gap-1 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">{t("name")}: </span>
                <span className="font-semibold">
                  {guest.name} (#{guest.id})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("table")}: </span>
                <span className="font-semibold">{guest.tableNumber}</span>
              </div>
            </div>
            <div className="mt-1">
              <span className="text-muted-foreground">{t("registered")}: </span>
              <span className="font-medium">
                {formatDateTimeToLocaleString(guest.createdAt)}
              </span>
            </div>
          </div>
        </Fragment>
      )}

      <div className="space-y-2">
        <div className="font-semibold">{t("ordersLabel")}</div>
        <div className="hidden sm:grid grid-cols-[28px_28px_1fr_56px_92px_170px_28px] gap-2 text-[11px] uppercase tracking-wide text-muted-foreground px-1">
          <span>#</span>
          <span></span>
          <span>{t("dish")}</span>
          <span className="text-center">Qty</span>
          <span className="text-right">{t("total")}</span>
          <span>{t("created")}</span>
          <span></span>
        </div>
        {visibleOrders.map((order, index) => (
          <div
            key={order.id}
            className="grid grid-cols-[22px_22px_1fr_48px_90px_70px_28px] sm:grid-cols-[28px_28px_1fr_56px_92px_170px_28px] items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
          >
            <span className="text-muted-foreground">{index + 1}</span>
            <span title={statusLabel(order.status)}>
              {order.status === OrderStatus.Pending && <OrderStatusIcon.Pending className="w-4 h-4" />}
              {order.status === OrderStatus.Processing && <OrderStatusIcon.Processing className="w-4 h-4" />}
              {order.status === OrderStatus.Rejected && <OrderStatusIcon.Rejected className="w-4 h-4 text-red-400" />}
              {order.status === OrderStatus.Delivered && <OrderStatusIcon.Delivered className="w-4 h-4" />}
              {order.status === OrderStatus.Paid && <OrderStatusIcon.Paid className="w-4 h-4 text-yellow-400" />}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src={order.dishSnapshot.image}
                alt={order.dishSnapshot.name}
                title={order.dishSnapshot.name}
                width={28}
                height={28}
                className="h-7 w-7 rounded object-cover"
              />
              <span className="truncate" title={order.dishSnapshot.name}>
                {order.dishSnapshot.name}
              </span>
            </div>
            <span className="text-center font-semibold" title={`${t("total")}: ${order.quantity}`}>
              x{order.quantity}
            </span>
            <span className="text-right font-medium">
              {formatCurrency(order.quantity * order.dishSnapshot.price)}
            </span>
            <span
              className="text-muted-foreground"
              title={`${t("created")}: ${formatDateTimeToLocaleString(order.createdAt)} | ${t("updated")}: ${formatDateTimeToLocaleString(order.updatedAt)}`}
            >
              <span className="hidden sm:inline">
                {formatDateTimeToLocaleString(order.createdAt)}
              </span>
              <span className="sm:hidden">
                {formatDateTimeToTimeString(order.createdAt)}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:text-destructive"
              disabled={deletingOrderIds.has(order.id)}
              onClick={() => handleDeleteOrder(order.id)}
              title="Xóa đơn hàng"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
          <span className="font-semibold">{t("unpaid")}</span>
          <Badge className="text-xs">
            <span>
              {formatCurrency(
                ordersFilterToPurchase.reduce((acc, order) => {
                  return acc + order.quantity * order.dishSnapshot.price;
                }, 0),
              )}
            </span>
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <span className="font-semibold">{t("paid")}</span>
          <Badge variant={"outline"} className="text-xs">
            <span>
              {formatCurrency(
                purchasedOrderFilter.reduce((acc, order) => {
                  return acc + order.quantity * order.dishSnapshot.price;
                }, 0),
              )}
            </span>
          </Badge>
        </div>
      </div>

      <div>
        <Button className="w-full font-semibold" size={"sm"} variant={"default"} disabled={ordersFilterToPurchase.length === 0} onClick={pay}>
          {t("payAll")} ({ordersFilterToPurchase.length} {t("ordersCountUnit")})
        </Button>
      </div>
    </div>
  );
}
