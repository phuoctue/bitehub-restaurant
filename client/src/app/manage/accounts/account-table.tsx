"use client";

import { CaretSortIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountListResType, AccountType } from "@/schemaValidations/account.schema";
import AddEmployee from "@/app/manage/accounts/add-employee";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditEmployee from "@/app/manage/accounts/edit-employee";
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
import { useSearchParams } from "next/navigation";
import AutoPagination from "@/components/auto-pagination";
import { useAccountList, useDeleteAccountMutation } from "@/queries/useAccount";
import { toast } from "sonner";
import { handleErrorApi, cn } from "@/lib/utils";
import { useAppStore } from "@/components/app-provider";
import { Role } from "@/constants/type";
import { TranslationValues, useTranslations } from "next-intl";

type AccountItem = AccountListResType["data"][0];
type TAccounts = (key: string, values?: TranslationValues) => string;

const AccountTableContext = createContext<{
  setEmployeeIdEdit: (value: number) => void;
  employeeIdEdit: number | undefined;
  employeeDelete: AccountItem | null;
  setEmployeeDelete: (value: AccountItem | null) => void;
}>({
  setEmployeeIdEdit: () => {},
  employeeIdEdit: undefined,
  employeeDelete: null,
  setEmployeeDelete: () => {},
});

function createColumns(t: TAccounts): ColumnDef<AccountType>[] {
  return [
    { accessorKey: "id", header: "ID" },
    {
      accessorKey: "avatar",
      header: t("avatar"),
      cell: ({ row }) => (
        <Avatar className="aspect-square w-[100px] h-[100px] rounded-md object-cover">
          <AvatarImage src={row.getValue("avatar")} />
          <AvatarFallback className="rounded-none">{row.original.name}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setEmployeeIdEdit, setEmployeeDelete } = useContext(AccountTableContext);
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
              <DropdownMenuItem onClick={() => setEmployeeIdEdit(row.original.id)}>{t("edit")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEmployeeDelete(row.original)}>{t("delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

function AlertDialogDeleteAccount({
  employeeDelete,
  setEmployeeDelete,
}: {
  employeeDelete: AccountItem | null;
  setEmployeeDelete: (value: AccountItem | null) => void;
}) {
  const t = useTranslations("ManageAccounts");
  const { mutateAsync } = useDeleteAccountMutation();

  const deleteAccount = async () => {
    if (!employeeDelete) return;
    try {
      const result = await mutateAsync(employeeDelete.id);
      setEmployeeDelete(null);
      toast.success(result.payload.message);
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <AlertDialog open={Boolean(employeeDelete)} onOpenChange={(v) => !v && setEmployeeDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteEmployeeTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("account")} <span className="bg-foreground text-primary-foreground rounded px-1">{employeeDelete?.name}</span> {t("deleteEmployeeDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteAccount}>{t("continue")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const PAGE_SIZE = 6;
export default function AccountTable() {
  const t = useTranslations("ManageAccounts");
  const role = useAppStore((state) => state.role);
  const canManageEmployees = role === Role.Owner;
  const columns = useMemo(() => createColumns(t), [t]);

  const searchParam = useSearchParams();
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;

  const [employeeIdEdit, setEmployeeIdEdit] = useState<number | undefined>();
  const [employeeDelete, setEmployeeDelete] = useState<AccountItem | null>(null);
  const accountListQuery = useAccountList();
  const data = accountListQuery.data?.payload.data ?? [];
  const displayColumns = canManageEmployees ? columns : columns.filter((column) => column.id !== "actions");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: PAGE_SIZE,
  });

  const table = useReactTable({
    data,
    columns: displayColumns,
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
      pageIndex,
      pageSize: PAGE_SIZE,
    });
  }, [table, pageIndex]);

  return (
    <AccountTableContext.Provider value={{ employeeIdEdit, setEmployeeIdEdit, employeeDelete, setEmployeeDelete }}>
      <div className="w-full">
        {canManageEmployees && <EditEmployee id={employeeIdEdit} setId={setEmployeeIdEdit} onSubmitSuccess={() => {}} />}
        {canManageEmployees && <AlertDialogDeleteAccount employeeDelete={employeeDelete} setEmployeeDelete={setEmployeeDelete} />}
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <Input
            placeholder={t("filterEmails")}
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
            className="w-full sm:max-w-sm"
          />
          {canManageEmployees && (
            <div className="flex items-center gap-2 sm:ml-auto">
              <AddEmployee />
            </div>
          )}
        </div>
        <div className="grid gap-3 md:hidden">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const item = row.original;
              return (
                <div key={row.id} className="rounded-md border bg-background p-3 shadow-sm">
                  <div className="flex gap-3">
                    <Avatar className="h-20 w-20 shrink-0 rounded-md">
                      <AvatarImage src={item.avatar ?? undefined} />
                      <AvatarFallback className="rounded-md text-xs">{item.name}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="line-clamp-2 font-medium">{item.name}</div>
                          <div className="truncate text-sm text-muted-foreground">{item.email}</div>
                        </div>
                        {canManageEmployees && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 shrink-0 p-0">
                                <span className="sr-only">{t("openMenu")}</span>
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setEmployeeIdEdit(item.id)}>{t("edit")}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEmployeeDelete(item)}>{t("delete")}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">ID #{item.id}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">{t("noResults")}</div>
          )}
        </div>
        <div className="hidden rounded-md border overflow-x-auto md:block">
          <Table className="min-w-[700px] md:min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={cn({ "hidden md:table-cell": header.id === "id" || header.id === "email" })}>
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
                      <TableCell key={cell.id} className={cn({ "hidden md:table-cell": cell.column.id === "id" || cell.column.id === "email" })}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={displayColumns.length} className="h-24 text-center">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-xs text-muted-foreground py-4 flex-1 ">
            {t("showing")} <strong>{table.getPaginationRowModel().rows.length}</strong> {t("of")} <strong>{data.length}</strong> {t("results")}
          </div>
          <div>
            <AutoPagination page={table.getState().pagination.pageIndex + 1} pageSize={table.getPageCount()} pathname="/manage/accounts" />
          </div>
        </div>
      </div>
    </AccountTableContext.Provider>
  );
}
