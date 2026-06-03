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
import { Fragment } from "react";
import { useTranslations } from "next-intl";

type Guest = GetOrdersResType["data"][0]["guest"];
type Orders = GetOrdersResType["data"];

export default function OrderGuestDetail({ guest, orders }: { guest: Guest; orders: Orders }) {
  const t = useTranslations("ManageOrders");
  const statusLabel = (status: (typeof OrderStatusValues)[number]) => t(`status.${status}`);

  const ordersFilterToPurchase = guest ? orders.filter((order) => order.status !== OrderStatus.Paid && order.status !== OrderStatus.Rejected) : [];
  const purchasedOrderFilter = guest ? orders.filter((order) => order.status === OrderStatus.Paid) : [];
  const payForGuestMutation = usePayForGuestMuattion();

  const pay = async () => {
    if (payForGuestMutation.isPending || !guest) return;
<<<<<<< Updated upstream
    const clientSentAt = Date.now();
    const timingLabel = `staff-pay-guest:${guest.id}:${clientSentAt}`;
    try {
      console.time(timingLabel);
      console.log(`[realtime][client][staff/orders/pay] send at ${clientSentAt}`);
      const result = await payForGuestMutation.mutateAsync({
        guestId: guest.id,
        clientSentAt,
      });

      const invoiceUrlFromPay = result.payload.invoice?.invoiceUrl;
      if (invoiceUrlFromPay) {
        invoiceApiRequest.printInvoice(invoiceUrlFromPay);
        return;
      }

      const paidOrders = result.payload.data;
      if (paidOrders.length > 0) {
        const invoiceResult = await orderApiRequest.getOrderInvoice(paidOrders[0].id);
        invoiceApiRequest.printInvoice(invoiceResult.payload.data.invoiceUrl);
      }
    } catch (error) {
      handleErrorApi({ error });
    } finally {
      console.timeEnd(timingLabel);
=======
    const printWindow = invoiceApiRequest.openPrintWindow();
    try {
      const result = await payForGuestMutation.mutateAsync({
        guestId: guest.id,
      });

      const invoiceUrlFromPay = result.payload.invoice?.invoiceUrl;
      if (invoiceUrlFromPay) {
        invoiceApiRequest.printInvoice(invoiceUrlFromPay, printWindow);
        return;
      }

      const paidOrders = result.payload.data;
      if (paidOrders.length > 0) {
        const invoiceResult = await orderApiRequest.getOrderInvoice(paidOrders[0].id);
        invoiceApiRequest.printInvoice(invoiceResult.payload.data.invoiceUrl, printWindow);
        return;
      }

      printWindow?.close();
    } catch (error) {
      printWindow?.close();
      handleErrorApi({ error });
>>>>>>> Stashed changes
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
        <div className="hidden sm:grid grid-cols-[28px_28px_1fr_56px_92px_170px] gap-2 text-[11px] uppercase tracking-wide text-muted-foreground px-1">
          <span>#</span>
          <span></span>
          <span>{t("dish")}</span>
          <span className="text-center">Qty</span>
          <span className="text-right">{t("total")}</span>
          <span>{t("created")}</span>
        </div>
        {orders.map((order, index) => (
          <div
            key={order.id}
            className="grid grid-cols-[22px_22px_1fr_48px_90px_70px] sm:grid-cols-[28px_28px_1fr_56px_92px_170px] items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
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
