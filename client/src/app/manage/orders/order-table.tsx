"use client";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GetOrdersResType, PayGuestOrdersResType, UpdateOrderResType } from "@/schemaValidations/order.schema";
import AddOrder from "@/app/manage/orders/add-order";
import EditOrder from "@/app/manage/orders/edit-order";
import { createContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AutoPagination from "@/components/auto-pagination";
import { formatCurrency, handleErrorApi } from "@/lib/utils";
import { OrderStatus, OrderStatusValues } from "@/constants/type";
import OrderStatics from "@/app/manage/orders/order-statics";
import orderTableColumnsFactory from "@/app/manage/orders/order-table-columns";
import { useOrderService } from "@/app/manage/orders/order.service";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { endOfDay, format, startOfDay } from "date-fns";
import TableSkeleton from "@/app/manage/orders/table-skeleton";
import { GuestCreateOrdersResType } from "@/schemaValidations/guest.schema";
import { useGetOrderListQuery, useUpdateOrderMutation } from "@/queries/useOrder";
import { usegetTableListQuery } from "@/queries/useTable";
import { toast as toastSonner } from "sonner";
import { useAppStore } from "@/components/app-provider";
import { useTranslations } from "next-intl";
import Image from "next/image";
import orderApiRequest from "@/apiRequest/order";
import { useInvoice } from "@/queries/useInvoice";

export const OrderTableContext = createContext({
  setOrderIdEdit: (_value: number | undefined) => {},
  orderIdEdit: undefined as number | undefined,
  changeStatus: (_payload: { orderId: number; dishId: number; status: (typeof OrderStatusValues)[number]; quantity: number }) => {},
  orderObjectByGuestId: {} as OrderObjectByGuestID,
});

export type StatusCountObject = Record<(typeof OrderStatusValues)[number], number>;
export type Statics = { status: StatusCountObject; table: Record<number, Record<number, StatusCountObject>> };
export type OrderObjectByGuestID = Record<number, GetOrdersResType["data"]>;
export type ServingGuestByTableNumber = Record<number, OrderObjectByGuestID>;

const PAGE_SIZE = 6;
const initFromDate = startOfDay(new Date());
const initToDate = endOfDay(new Date());

export default function OrderTable() {
  const t = useTranslations("ManageOrders");
  const statusLabel = (status: (typeof OrderStatusValues)[number]) => t(`status.${status}`);
  const searchParam = useSearchParams();
  const socket = useAppStore((state) => state.socket);
  const [openStatusFilter, setOpenStatusFilter] = useState(false);
  const [fromDate, setFromDate] = useState(initFromDate);
  const [toDate, setToDate] = useState(initToDate);
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;
  const [orderIdEdit, setOrderIdEdit] = useState<number | undefined>();
  const orderListQuery = useGetOrderListQuery({ fromDate, toDate });
  const refetchOrderList = orderListQuery.refetch;
  const orderList = orderListQuery.data?.payload.data ?? [];
  const tableListQuery = usegetTableListQuery();
  const tableList = tableListQuery.data?.payload.data ?? [];
  const tableListSortedByNumber = tableList.sort((a, b) => a.number - b.number);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const orderTableColumns = orderTableColumnsFactory(t);
  const [pagination, setPagination] = useState({ pageIndex, pageSize: PAGE_SIZE });
  const updateOrderMutation = useUpdateOrderMutation();
  const { printInvoice, downloadInvoice, isDownloading } = useInvoice();
  const { statics, orderObjectByGuestId, servingGuestByTableNumber } = useOrderService(orderList);

  const changeStatus = async (body: { orderId: number; dishId: number; status: (typeof OrderStatusValues)[number]; quantity: number }) => {
    const clientSentAt = Date.now();
    const timingLabel = `staff-change-order:${body.orderId}:${clientSentAt}`;
    try {
      console.time(timingLabel);
      console.log(`[realtime][client][staff/orders/change-status] send at ${clientSentAt}`);
      await updateOrderMutation.mutateAsync({ ...body, clientSentAt });
    } catch (error) {
      handleErrorApi({ error });
    } finally {
      console.timeEnd(timingLabel);
    }
  };

  const table = useReactTable({
    data: orderList,
    columns: orderTableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
  });

  useEffect(() => {
    table.setPagination({ pageIndex, pageSize: PAGE_SIZE });
  }, [table, pageIndex]);

  useEffect(() => {
    function onUpdateOrder(data: UpdateOrderResType["data"]) {
      const { dishSnapshot: { name } } = data;
      toastSonner.success(
        t("toastOrderUpdated", {
          dish: name,
          quantity: data.quantity,
          status: statusLabel(data.status),
        }),
      );
      refetchOrderList();
    }

    function onNewOrder(data: GuestCreateOrdersResType["data"]) {
      const { guest } = data[0];
      toastSonner.success(
        t("toastNewOrder", {
          guest: guest?.name ?? "",
          table: guest?.tableNumber ?? "",
          count: data.length,
        }),
      );
      refetchOrderList();
    }

    function onPayment(data: PayGuestOrdersResType["data"]) {
      const { guest } = data[0];
      toastSonner.success(
        t("toastPayment", {
          guest: guest?.name ?? "",
          table: guest?.tableNumber ?? "",
          count: data.length,
        }),
      );
      refetchOrderList();
    }

    function onDeleteOrder(data: UpdateOrderResType["data"]) {
      refetchOrderList();
    }

    socket?.on("update-order", onUpdateOrder);
    socket?.on("new-order", onNewOrder);
    socket?.on("payment", onPayment);
    socket?.on("delete-order", onDeleteOrder);
    return () => {
      socket?.off("update-order", onUpdateOrder);
      socket?.off("new-order", onNewOrder);
      socket?.off("payment", onPayment);
      socket?.off("delete-order", onDeleteOrder);
    };
  }, [refetchOrderList, socket, t]);

  return (
    <OrderTableContext.Provider value={{ orderIdEdit, setOrderIdEdit, changeStatus, orderObjectByGuestId }}>
      <div className="w-full">
        <EditOrder id={orderIdEdit} setId={setOrderIdEdit} onSubmitSuccess={() => refetchOrderList()} />
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <div className="grid gap-1.5 sm:flex sm:items-center sm:gap-2">
              <span className="text-sm whitespace-nowrap">{t("from")}</span>
              <Input
                type="datetime-local"
                placeholder={t("fromDate")}
                className="w-full text-sm sm:w-[170px]"
                value={format(fromDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
                onChange={(event) => setFromDate(new Date(event.target.value))}
              />
            </div>
            <div className="grid gap-1.5 sm:flex sm:items-center sm:gap-2">
              <span className="text-sm whitespace-nowrap">{t("to")}</span>
              <Input
                type="datetime-local"
                placeholder={t("toDate")}
                className="w-full text-sm sm:w-[170px]"
                value={format(toDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
                onChange={(event) => setToDate(new Date(event.target.value))}
              />
            </div>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => { setFromDate(initFromDate); setToDate(initToDate); }} size="sm">
              {t("reset")}
            </Button>
          </div>
          <div className="sm:ml-auto">
            <AddOrder />
          </div>
        </div>

        <div className="grid gap-2 py-4 sm:flex sm:flex-wrap sm:items-center">
          <Input
            placeholder={t("customerName")}
            value={(table.getColumn("guestName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("guestName")?.setFilterValue(event.target.value)}
            className="w-full sm:w-[140px]"
          />
          <Input
            placeholder={t("tableNumber")}
            value={(table.getColumn("tableNumber")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("tableNumber")?.setFilterValue(event.target.value)}
            className="w-full sm:w-[80px]"
          />
          <Popover open={openStatusFilter} onOpenChange={setOpenStatusFilter}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={openStatusFilter} className="w-full justify-between text-sm sm:w-[150px]">
                {table.getColumn("status")?.getFilterValue()
                  ? statusLabel(table.getColumn("status")?.getFilterValue() as (typeof OrderStatusValues)[number])
                  : t("statusLabel")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandGroup>
                  <CommandList>
                    {OrderStatusValues.map((status) => (
                      <CommandItem
                        key={status}
                        value={status}
                        onSelect={(currentValue) => {
                          table.getColumn("status")?.setFilterValue(currentValue === table.getColumn("status")?.getFilterValue() ? "" : currentValue);
                          setOpenStatusFilter(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", table.getColumn("status")?.getFilterValue() === status ? "opacity-100" : "opacity-0")} />
                        {statusLabel(status)}
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <OrderStatics statics={statics} tableList={tableListSortedByNumber} servingGuestByTableNumber={servingGuestByTableNumber} />
        {orderListQuery.isPending && <TableSkeleton />}
        {!orderListQuery.isPending && (
          <div className="grid gap-3 md:hidden">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const order = row.original;
                const isPaid = order.status === OrderStatus.Paid;
                return (
                  <div key={row.id} className="rounded-md border bg-background p-3 shadow-sm">
                    <div className="flex gap-3">
                      <Image
                        src={order.dishSnapshot.image}
                        alt={order.dishSnapshot.name}
                        width={72}
                        height={72}
                        className="h-20 w-20 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="line-clamp-2 font-medium">{order.dishSnapshot.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(order.dishSnapshot.price * order.quantity)}
                            </div>
                          </div>
                          <Badge variant="secondary">x{order.quantity}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">{t("table")}</div>
                            <div className="font-medium">{order.tableNumber}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-muted-foreground">{t("customer")}</div>
                            <div className="truncate font-medium">{order.guest ? `${order.guest.name} (#${order.guest.id})` : t("deleted")}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      <Select
                        onValueChange={(value: (typeof OrderStatusValues)[number]) => {
                          changeStatus({
                            orderId: order.id,
                            dishId: order.dishSnapshot.dishId!,
                            status: value,
                            quantity: order.quantity,
                          });
                        }}
                        value={order.status}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("statusLabel")} />
                        </SelectTrigger>
                        <SelectContent>
                          {OrderStatusValues.map((status) => (
                            <SelectItem key={status} value={status}>
                              {statusLabel(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline" size="sm" onClick={() => setOrderIdEdit(order.id)}>
                          {t("edit")}
                        </Button>
                        {isPaid && (
                          <>
                            <Button
                              className="flex-1"
                              variant="outline"
                              size="sm"
                              disabled={isDownloading}
                              onClick={async () => {
                                try {
                                  const invoiceResult = await orderApiRequest.getOrderInvoice(order.id);
                                  downloadInvoice(invoiceResult.payload.data.invoiceUrl);
                                } catch (error) {
                                  handleErrorApi({ error });
                                }
                              }}
                            >
                              PDF
                            </Button>
                            <Button
                              className="flex-1"
                              variant="outline"
                              size="sm"
                              disabled={isDownloading}
                              onClick={async () => {
                                try {
                                  const invoiceResult = await orderApiRequest.getOrderInvoice(order.id);
                                  printInvoice(invoiceResult.payload.data.invoiceUrl);
                                } catch (error) {
                                  handleErrorApi({ error });
                                }
                              }}
                            >
                              Print
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">{t("noResults")}</div>
            )}
          </div>
        )}
        {!orderListQuery.isPending && (
          <div className="hidden rounded-md border overflow-x-auto md:block">
            <Table className="min-w-[900px] md:min-w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className={cn({ "hidden md:table-cell": header.id === "orderHandlerName" || header.id === "createdAt" })}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={cn({ "hidden md:table-cell": cell.column.id === "orderHandlerName" || cell.column.id === "createdAt" })}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={orderTableColumns.length} className="h-24 text-center">
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-xs text-muted-foreground py-4 flex-1 ">
            {t("showing")} <strong>{table.getPaginationRowModel().rows.length}</strong> {t("of")} <strong>{orderList.length}</strong> {t("results")}
          </div>
          <div>
            <AutoPagination page={table.getState().pagination.pageIndex + 1} pageSize={table.getPageCount()} pathname="/manage/orders" />
          </div>
        </div>
      </div>
    </OrderTableContext.Provider>
  );
}
