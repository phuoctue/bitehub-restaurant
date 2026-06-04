"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, handleErrorApi } from "@/lib/utils";
import { useGetDishListQuery } from "@/queries/useDish";
import Quantity from "./quantity";
import { GuestCreateOrdersBodyType } from "@/schemaValidations/guest.schema";
import { useGuestOrderMuatation } from "@/queries/useGuest";
import { useRouter } from "next/navigation";
import { DishStatus } from "@/constants/type";
import { withLocalePath } from "@/lib/locale-path";
import { useTranslations } from "next-intl";

export default function MenuOrder() {
  const t = useTranslations("GuestMenu");
  const { data } = useGetDishListQuery();
  const dishes = useMemo(
    () =>
      (data?.payload.data ?? []).filter(
        (dish) => dish.status !== DishStatus.Hidden,
      ),
    [data],
  );
  const [orders, setOrders] = useState<GuestCreateOrdersBodyType>([]);
  const { mutateAsync } = useGuestOrderMuatation();
  const router = useRouter();

  const totalPrice = useMemo(() => {
    return dishes.reduce((total, dish) => {
      const order = orders.find((item) => item.dishId === dish.id);
      if (!order) return total;
      return total + dish.price * order.quantity;
    }, 0);
  }, [orders, dishes]);

  const totalItems = useMemo(
    () => orders.reduce((sum, item) => sum + item.quantity, 0),
    [orders],
  );

  const handleQuantityChange = (dishId: number, quantity: number) => {
    setOrders((prevOrders) => {
      if (quantity === 0) {
        return prevOrders.filter((order) => order.dishId !== dishId);
      }
      const index = prevOrders.findIndex((order) => order.dishId === dishId);
      if (index === -1) {
        return [...prevOrders, { dishId, quantity }];
      }
      const newOrders = [...prevOrders];
      newOrders[index] = { ...newOrders[index], quantity };
      return newOrders;
    });
  };

  const handleOrder = async () => {
    const clientSentAt = Date.now();
    const timingLabel = `guest-order:${clientSentAt}`;
    try {
      console.time(timingLabel);
      console.log(`[realtime][client][guest/orders] send at ${clientSentAt}`);
      await mutateAsync({ orders, clientSentAt });
      router.push(withLocalePath("/guest/orders"));
    } catch (error) {
      handleErrorApi({ error });
    } finally {
      console.timeEnd(timingLabel);
    }
  };

  return (
    <>
      <div className="mb-5 space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {dishes.map((dish) => {
          const quantity = orders.find((order) => order.dishId === dish.id)?.quantity ?? 0;
          const isUnavailable = dish.status === DishStatus.Unavailable;

          return (
            <article
              key={dish.id}
              className={cn(
                "rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur transition hover:border-primary/40 hover:shadow-md",
                { "opacity-60": isUnavailable },
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  {isUnavailable && (
                    <span className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/55 px-2 text-center text-xs font-semibold text-white">
                      {t("outOfStock")}
                    </span>
                  )}
                  <Image
                    src={dish.image}
                    alt={dish.name}
                    height={112}
                    width={112}
                    quality={100}
                    className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-base font-semibold">{dish.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{dish.description}</p>
                  <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(dish.price)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end">
                {isUnavailable ? (
                  <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    {t("outOfStock")}
                  </span>
                ) : (
                  <Quantity onChange={(value) => handleQuantityChange(dish.id, value)} value={quantity} />
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 p-3 backdrop-blur md:p-4">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <div className="min-w-0 flex-1 rounded-xl border border-border/60 bg-card/70 px-3 py-2">
            <p className="truncate text-sm font-medium">
              {t("orderSummary", { count: totalItems })}
            </p>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</p>
          </div>
          <Button
            className="h-12 min-w-32 rounded-xl px-5 text-sm font-semibold sm:text-base"
            onClick={handleOrder}
            disabled={orders.length === 0}
          >
            {t("placeOrder")}
          </Button>
        </div>
      </div>
    </>
  );
}
