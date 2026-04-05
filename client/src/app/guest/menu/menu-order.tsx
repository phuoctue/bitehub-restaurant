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

export default function MenuOrder() {
  const { data } = useGetDishListQuery();
  const dishes = useMemo(
    () =>
      (data?.payload.data ?? []).filter(
        //lọc status hidden khỏi UI
        (dish) => dish.status !== DishStatus.Hidden,
      ),
    [data],
  );
  const [orders, setOrders] = useState<GuestCreateOrdersBodyType>([]);
  const { mutateAsync } = useGuestOrderMuatation();
  const router = useRouter();
  const totalPrice = useMemo(() => {
    return dishes.reduce((total, dish) => {
      const order = orders.find((order) => order.dishId === dish.id);
      if (!order) return total;
      return total + dish.price * order.quantity;
    }, 0);
  }, [orders, dishes]);

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
    try {
      await mutateAsync(orders);
      router.push("/guest/orders");
    } catch (error) {
      handleErrorApi({
        error,
      });
    }
  };
  return (
    <>
      <div className="space-y-4">
        {dishes.map((dish) => (
          <div
            key={dish.id}
            className={cn(
              "flex items-center gap-4 p-2 rounded-lg border border-transparent hover:border-muted transition-all",
              {
                "pointer-events-none opacity-50":
                  dish.status === DishStatus.Unavailable,
              },
            )}
          >
            <div className="flex-shrink-0 relative">
              {dish.status === DishStatus.Unavailable && (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold bg-black/40 text-white rounded-lg z-10">
                  Hết hàng
                </span>
              )}
              <Image
                src={dish.image}
                alt={dish.name}
                height={100}
                width={100}
                quality={100}
                className="object-cover w-[80px] h-[80px] rounded-lg shadow-sm"
              />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{dish.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {dish.description}
              </p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(dish.price)}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1">
              {dish.status === DishStatus.Available ? (
                <Quantity
                  onChange={(value) => handleQuantityChange(dish.id, value)}
                  value={
                    orders.find((order) => order.dishId === dish.id)
                      ?.quantity ?? 0
                  }
                />
              ) : (
                <span className="text-xs font-semibold text-red-500">
                  Hết hàng
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[368px]">
        <Button
          className="w-full h-12 shadow-lg rounded-full px-6 flex justify-between items-center bg-primary hover:bg-primary/90 transition-colors"
          onClick={handleOrder}
          disabled={orders.length === 0}
        >
          <span className="font-medium">Đặt hàng · {orders.length} món</span>
          <span className="font-bold text-lg">
            {formatCurrency(totalPrice)}
          </span>
        </Button>
      </div>
    </>
  );
}
