"use client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  GuestLoginBody,
  GuestLoginBodyType,
} from "@/schemaValidations/guest.schema";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TablesDialog } from "@/app/manage/orders/tables-dialog";
import { GetListGuestsResType } from "@/schemaValidations/account.schema";
import { Switch } from "@/components/ui/switch";
import GuestsDialog from "@/app/manage/orders/guests-dialog";
import { CreateOrdersBodyType } from "@/schemaValidations/order.schema";
import Quantity from "@/app/guest/menu/quantity";
import Image from "next/image";
import { cn, formatCurrency, handleErrorApi } from "@/lib/utils";
import { DishStatus } from "@/constants/type";
import { useGetDishListQuery } from "@/queries/useDish";
import { useCreateOrderMutation } from "@/queries/useOrder";
import { useCreateGuestMutation } from "@/queries/useAccount";
import { toast } from "sonner";

export default function AddOrder() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<
    GetListGuestsResType["data"][0] | null
  >(null);
  const [isNewGuest, setIsNewGuest] = useState(true);
  const [orders, setOrders] = useState<CreateOrdersBodyType["orders"]>([]);
  const { data } = useGetDishListQuery();
  const dishes = data?.payload.data ?? [];

  const totalPrice = useMemo(() => {
    return dishes.reduce((result, dish) => {
      const order = orders.find((order) => order.dishId === dish.id);
      if (!order) return result;
      return result + order.quantity * dish.price;
    }, 0);
  }, [dishes, orders]);

  const visibleDishes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const available = dishes.filter((dish) => dish.status !== DishStatus.Hidden);
    if (!keyword) return available;
    return available.filter((dish) => {
      return (
        dish.name.toLowerCase().includes(keyword) ||
        dish.description.toLowerCase().includes(keyword)
      );
    });
  }, [dishes, search]);

  const createOrdersMutation = useCreateOrderMutation();
  const createGuestMutation = useCreateGuestMutation();

  const form = useForm<GuestLoginBodyType>({
    resolver: zodResolver(GuestLoginBody),
    defaultValues: {
      name: "",
      tableNumber: 0,
    },
  });
  const name = form.watch("name");
  const tableNumber = form.watch("tableNumber");

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
      let guestId = selectedGuest?.id;
      if (isNewGuest) {
        const guestRes = await createGuestMutation.mutateAsync({
          name,
          tableNumber,
        });
        guestId = guestRes.payload.data.id;
      }
      if (!guestId) {
        toast.error(t("ManageOrders.chooseCustomer"));
        return;
      }
      await createOrdersMutation.mutateAsync({
        guestId: guestId as number,
        orders,
      });
      reset();
      toast.success(t("ManageOrders.orderSuccess"));
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  const reset = () => {
    form.reset();
    setSelectedGuest(null);
    setIsNewGuest(true);
    setOrders([]);
    setSearch("");
    setOpen(false);
  };

  return (
    <Dialog
      onOpenChange={(value) => {
        if (!value) {
          reset();
        }
        setOpen(value);
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {t("ManageOrders.createOrder")}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle>{t("ManageOrders.createOrder")}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[calc(90vh-74px)] flex-col overflow-hidden">
          <div className="space-y-4 border-b border-border/60 px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="isNewGuest">{t("ManageOrders.newGuest")}</Label>
              <div className="col-span-1 sm:col-span-3 flex items-center">
                <Switch
                  id="isNewGuest"
                  checked={isNewGuest}
                  onCheckedChange={setIsNewGuest}
                />
              </div>
            </div>

            {isNewGuest && (
              <Form {...form}>
                <form noValidate className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                          <Label htmlFor="name">{t("ManageOrders.customerName")}</Label>
                          <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                            <Input id="name" className="w-full" {...field} />
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tableNumber"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                          <Label htmlFor="tableNumber">{t("ManageOrders.selectTable")}</Label>
                          <div className="col-span-1 sm:col-span-3 w-full">
                            <div className="flex items-center gap-4">
                              <div className="rounded-md bg-muted px-3 py-1.5 text-sm font-semibold">
                                {field.value}
                              </div>
                              <TablesDialog
                                isForAddOrder={true}
                                onChoose={(table) => {
                                  field.onChange(table.number);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}

            {!isNewGuest && (
              <GuestsDialog
                onChoose={(guest) => {
                  setSelectedGuest(guest);
                }}
              />
            )}

            {!isNewGuest && selectedGuest && (
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 text-sm">
                <Label htmlFor="selectedGuest">{t("ManageOrders.selectedGuest")}</Label>
                <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                  <div className="rounded-md bg-muted px-2.5 py-1">
                    {selectedGuest.name} (#{selectedGuest.id})
                  </div>
                  <div className="rounded-md bg-muted px-2.5 py-1">
                    {t("table")}: {selectedGuest.tableNumber}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("ManageDishes.filterDishName")}
                className="sm:col-span-2"
              />
              <div className="rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                {t("ManageOrders.ordersLabel")}: <span className="font-semibold">{orders.length}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {visibleDishes.map((dish) => {
                const quantity =
                  orders.find((order) => order.dishId === dish.id)?.quantity ?? 0;
                const isUnavailable = dish.status === DishStatus.Unavailable;

                return (
                  <div
                    key={dish.id}
                    className={cn(
                      "flex gap-3 rounded-lg border border-border/70 p-3",
                      quantity > 0 && "border-primary/60 bg-primary/5",
                      isUnavailable && "pointer-events-none opacity-60"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      {isUnavailable && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                          {t("ManageOrders.outOfStock")}
                        </span>
                      )}
                      <Image
                        src={dish.image}
                        alt={dish.name}
                        height={100}
                        width={100}
                        quality={100}
                        className="h-[72px] w-[72px] rounded-md object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="line-clamp-1 text-sm font-semibold">{dish.name}</h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{dish.description}</p>
                      <p className="text-xs font-semibold">{formatCurrency(dish.price)}</p>
                    </div>

                    <div className="ml-auto flex flex-shrink-0 items-center justify-center">
                      <Quantity
                        onChange={(value) => handleQuantityChange(dish.id, value)}
                        value={quantity}
                      />
                    </div>
                  </div>
                );
              })}

              {visibleDishes.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("ManageDishes.noResults")}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button
              className="w-full justify-between"
              onClick={handleOrder}
              disabled={orders.length === 0 || (!isNewGuest && !selectedGuest)}
            >
              <span>
                {t("ManageOrders.createOrder")} · {orders.length} {t("ManageOrders.ordersCountUnit")}
              </span>
              <span>{formatCurrency(totalPrice)}</span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

