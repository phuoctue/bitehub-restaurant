import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AutoPagination from "@/components/auto-pagination";
import { useEffect, useMemo, useState } from "react";
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
import { cn, simpleMatchText } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TableListResType } from "@/schemaValidations/table.schema";
import { TableStatus } from "@/constants/type";
import { usegetTableListQuery } from "@/queries/useTable";
import { useTranslations } from "next-intl";

type TableItem = TableListResType["data"][0];
const PAGE_SIZE = 10;

export function TablesDialog({
  onChoose,
  isForAddOrder,
}: {
  onChoose: (table: TableItem) => void;
  isForAddOrder?: boolean;
}) {
  const t = useTranslations("ManageTables");
  const [open, setOpen] = useState(false);
  const tableListQuery = usegetTableListQuery();
  const data = tableListQuery.data?.payload.data ?? [];

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        accessorKey: "number",
        header: t("tableNumber"),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("number")}</div>
        ),
        filterFn: (row, _columnId, filterValue: string) => {
          if (filterValue === undefined) return true;
          return simpleMatchText(String(row.original.number), String(filterValue));
        },
      },
      {
        accessorKey: "capacity",
        header: t("capacity"),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("capacity")}</div>
        ),
      },
      {
        accessorKey: "status",
        header: t("statusLabel"),
        cell: ({ row }) => (
          <div>{t(`status.${String(row.getValue("status"))}`)}</div>
        ),
      },
    ],
    [t]
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  useEffect(() => {
    table.setPagination({
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    });
  }, [table]);

  const choose = (selectedTable: TableItem) => {
    onChoose(selectedTable);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t(isForAddOrder ? "selectTable" : "edit")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-full overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("tableNumber")}</DialogTitle>
        </DialogHeader>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder={t("filterTable")}
              value={(table.getColumn("number")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("number")?.setFilterValue(event.target.value)
              }
              className="w-[180px]"
            />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px] md:min-w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn({
                          "hidden md:table-cell": header.id === "capacity",
                        })}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => {
                        if (
                          row.original.status === TableStatus.Available ||
                          row.original.status === TableStatus.Reserved
                        ) {
                          choose(row.original);
                        }
                      }}
                      className={cn({
                        "cursor-pointer":
                          row.original.status === TableStatus.Available ||
                          row.original.status === TableStatus.Reserved,
                        "cursor-not-allowed":
                          row.original.status === TableStatus.Hidden,
                      })}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn({
                            "hidden md:table-cell": cell.column.id === "capacity",
                          })}
                        >
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
            <div className="text-xs text-muted-foreground py-4 flex-1">
              {t("showing")} <strong>{table.getPaginationRowModel().rows.length}</strong> {t("of")} <strong>{data.length}</strong> {t("results")}
            </div>
            <div>
              <AutoPagination
                page={table.getState().pagination.pageIndex + 1}
                pageSize={table.getPageCount()}
                pathname="/manage/tables"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
