"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { handleErrorApi, cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import AutoPagination from "@/components/auto-pagination";
import { TableListResType } from "@/schemaValidations/table.schema";
import EditTable from "@/app/manage/tables/edit-table";
import AddTable from "@/app/manage/tables/add-table";
import ImportTables from "@/app/manage/tables/import-tables";
import { useDeleteTableMutation, usegetTableListQuery } from "@/queries/useTable";
import QRCodeTable from "@/components/qrcode-table";
import { toast } from "sonner";
import { TranslationValues, useTranslations } from "next-intl";
import { useAppStore } from "@/components/app-provider";
import { useQueryClient } from "@tanstack/react-query";

type TableItem = TableListResType["data"][0];
type TTables = (key: string, values?: TranslationValues) => string;

const TableTableContext = createContext<{
  setTableIdEdit: (value: number) => void;
  tableIdEdit: number | undefined;
  tableDelete: TableItem | null;
  setTableDelete: (value: TableItem | null) => void;
}>({
  setTableIdEdit: () => {},
  tableIdEdit: undefined,
  tableDelete: null,
  setTableDelete: () => {},
});

function createColumns(t: TTables): ColumnDef<TableItem>[] {
  return [
    {
      accessorKey: "number",
      header: t("table"),
      cell: ({ row }) => <div className="capitalize">{row.getValue("number")}</div>,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        return String(row.getValue(columnId)).includes(String(filterValue));
      },
    },
    {
      accessorKey: "capacity",
      header: t("capacity"),
      cell: ({ row }) => <div className="capitalize">{row.getValue("capacity")}</div>,
    },
    {
      accessorKey: "status",
      header: t("statusLabel"),
      cell: ({ row }) => <div>{t(`status.${String(row.getValue("status"))}`)}</div>,
    },
    {
      accessorKey: "token",
      header: "QR Code",
      cell: ({ row }) => <QRCodeTable token={row.getValue("token")} tableNumber={row.getValue("number")} />,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setTableIdEdit, setTableDelete } = useContext(TableTableContext);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTableIdEdit(row.original.number)}>{t("edit")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTableDelete(row.original)}>{t("delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

function AlertDialogDeleteTable({
  tableDelete,
  setTableDelete,
}: {
  tableDelete: TableItem | null;
  setTableDelete: (value: TableItem | null) => void;
}) {
  const t = useTranslations("ManageTables");
  const { mutateAsync } = useDeleteTableMutation();
  const deleteTable = async () => {
    if (!tableDelete) return;
    try {
      const result = await mutateAsync(tableDelete.number);
      setTableDelete(null);
      toast.success(result.payload.message);
    } catch (error) {
      handleErrorApi({ error });
    }
  };
  return (
    <AlertDialog open={Boolean(tableDelete)} onOpenChange={(value) => !value && setTableDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTableTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("table")} <span className="bg-foreground text-primary-foreground rounded px-1">{tableDelete?.number}</span>{" "}
            {t("deleteTableDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteTable}>{t("continue")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const PAGE_SIZE = 10;
export default function TableTable() {
  const t = useTranslations("ManageTables");
  const columns = useMemo(() => createColumns(t), [t]);
  const searchParam = useSearchParams();
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;
  const [tableIdEdit, setTableIdEdit] = useState<number | undefined>();
  const [tableDelete, setTableDelete] = useState<TableItem | null>(null);
  const tableListQuery = usegetTableListQuery();
  const data = tableListQuery.data?.payload.data ?? [];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex, pageSize: PAGE_SIZE });
  const socket = useAppStore((state) => state.socket);
  const queryClient = useQueryClient();

  const table = useReactTable({
    data,
    columns,
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
    const onTableUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    };

    socket?.on("table-update", onTableUpdate);
    socket?.on("new-order", onTableUpdate);
    socket?.on("payment", onTableUpdate);
    return () => {
      socket?.off("table-update", onTableUpdate);
      socket?.off("new-order", onTableUpdate);
      socket?.off("payment", onTableUpdate);
    };
  }, [queryClient, socket]);

  return (
    <TableTableContext.Provider value={{ tableIdEdit, setTableIdEdit, tableDelete, setTableDelete }}>
      <div className="w-full">
        <EditTable id={tableIdEdit} setId={setTableIdEdit} />
        <AlertDialogDeleteTable tableDelete={tableDelete} setTableDelete={setTableDelete} />
        <div className="flex items-center py-4">
          <Input
            placeholder={t("filterTable")}
            value={(table.getColumn("number")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("number")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <div className="ml-auto flex items-center gap-2">
            <ImportTables />
            <AddTable />
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[700px] md:min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={cn({ "hidden md:table-cell": header.id === "capacity" })}>
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
                      <TableCell key={cell.id} className={cn({ "hidden md:table-cell": cell.column.id === "capacity" })}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-xs text-muted-foreground py-4 flex-1 ">
            {t("showing")} <strong>{table.getPaginationRowModel().rows.length}</strong> {t("of")}{" "}
            <strong>{data.length}</strong> {t("results")}
          </div>
          <div>
            <AutoPagination page={table.getState().pagination.pageIndex + 1} pageSize={table.getPageCount()} pathname="/manage/tables" />
          </div>
        </div>
      </div>
    </TableTableContext.Provider>
  );
}
