'use client'

import { DotsHorizontalIcon, CaretSortIcon } from '@radix-ui/react-icons'
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
  useReactTable
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { formatCurrency, handleErrorApi, cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import AutoPagination from '@/components/auto-pagination'
import { DishListResType } from '@/schemaValidations/dish.schema'
import EditDish from '@/app/manage/dishes/edit-dish'
import AddDish from '@/app/manage/dishes/add-dish'
import ImportDishes from '@/app/manage/dishes/import-dishes'
import { useGetDishListQuery, useDeleteDishMutation } from '@/queries/useDish'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { TranslationValues } from 'next-intl'

type DishItem = DishListResType['data'][0]
type TDishes = (key: string, values?: TranslationValues) => string

const DishTableContext = createContext<{
  setDishIdEdit: (value: number) => void
  dishIdEdit: number | undefined
  dishDelete: DishItem | null
  setDishDelete: (value: DishItem | null) => void
}>({
  setDishIdEdit: () => {},
  dishIdEdit: undefined,
  dishDelete: null,
  setDishDelete: () => {}
})

function createColumns(t: TDishes): ColumnDef<DishItem>[] {
  return [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'image',
      header: t('image'),
      cell: ({ row }) => (
        <Avatar className='aspect-square w-[100px] h-[100px] rounded-md object-cover'>
          <AvatarImage src={row.getValue('image')} />
          <AvatarFallback className='rounded-none'>{row.original.name}</AvatarFallback>
        </Avatar>
      )
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('dishName')}
          <CaretSortIcon className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => <div className='capitalize'>{row.getValue('name')}</div>
    },
    {
      accessorKey: 'price',
      header: t('price'),
      cell: ({ row }) => <div className='capitalize'>{formatCurrency(row.getValue('price'))}</div>
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: ({ row }) => (
        <div dangerouslySetInnerHTML={{ __html: row.getValue('description') }} className='whitespace-pre-line max-w-[300px] truncate' />
      )
    },
    {
      accessorKey: 'status',
      header: t('statusLabel'),
      cell: ({ row }) => <div>{t(`status.${String(row.getValue('status'))}`)}</div>
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setDishIdEdit, setDishDelete } = useContext(DishTableContext)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>{t('openMenu')}</span>
                <DotsHorizontalIcon className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDishIdEdit(row.original.id)}>{t('edit')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDishDelete(row.original)}>{t('delete')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}

function AlertDialogDeleteDish({
  dishDelete,
  setDishDelete
}: {
  dishDelete: DishItem | null
  setDishDelete: (value: DishItem | null) => void
}) {
  const t = useTranslations('ManageDishes')
  const { mutateAsync } = useDeleteDishMutation()
  const deleteDish = async () => {
    if (!dishDelete) return
    try {
      const result = await mutateAsync(dishDelete.id)
      setDishDelete(null)
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <AlertDialog open={Boolean(dishDelete)} onOpenChange={(value) => !value && setDishDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDishTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('dish')} <span className='bg-foreground text-primary-foreground rounded px-1'>{dishDelete?.name}</span>{' '}
            {t('deleteDishDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteDish}>{t('continue')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const PAGE_SIZE = 6

export default function DishTable() {
  const t = useTranslations('ManageDishes')
  const columns = useMemo(() => createColumns(t), [t])
  const searchParam = useSearchParams()
  const page = searchParam.get('page') ? Number(searchParam.get('page')) : 1
  const pageIndex = page - 1

  const [dishIdEdit, setDishIdEdit] = useState<number | undefined>()
  const [dishDelete, setDishDelete] = useState<DishItem | null>(null)
  const dishListQuery = useGetDishListQuery()
  const data = dishListQuery.data?.payload.data ?? []
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({ pageIndex, pageSize: PAGE_SIZE })

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
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination }
  })

  useEffect(() => {
    table.setPagination({ pageIndex, pageSize: PAGE_SIZE })
  }, [table, pageIndex])

  return (
    <DishTableContext.Provider value={{ dishIdEdit, setDishIdEdit, dishDelete, setDishDelete }}>
      <div className='w-full'>
        <EditDish id={dishIdEdit} setId={setDishIdEdit} />
        <AlertDialogDeleteDish dishDelete={dishDelete} setDishDelete={setDishDelete} />
        <div className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center'>
          <Input
            placeholder={t('filterDishName')}
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className='w-full sm:max-w-sm'
          />
          <div className='flex items-center gap-2 sm:ml-auto'>
            <ImportDishes />
            <AddDish />
          </div>
        </div>
        <div className='grid gap-3 md:hidden'>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const item = row.original
              return (
                <div key={row.id} className='rounded-md border bg-background p-3 shadow-sm'>
                  <div className='flex gap-3'>
                    <Avatar className='h-20 w-20 shrink-0 rounded-md'>
                      <AvatarImage src={item.image} />
                      <AvatarFallback className='rounded-md text-xs'>{item.name}</AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1 space-y-2'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <div className='line-clamp-2 font-medium'>{item.name}</div>
                          <div className='text-sm text-muted-foreground'>{formatCurrency(item.price)}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 shrink-0 p-0'>
                              <span className='sr-only'>{t('openMenu')}</span>
                              <DotsHorizontalIcon className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDishIdEdit(item.id)}>{t('edit')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDishDelete(item)}>{t('delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className='inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium'>
                        {t(`status.${item.status}`)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='rounded-md border p-6 text-center text-sm text-muted-foreground'>{t('noResults')}</div>
          )}
        </div>
        <div className='hidden rounded-md border overflow-x-auto md:block'>
          <Table className='min-w-[700px] md:min-w-full'>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={cn({ 'hidden md:table-cell': header.id === 'id' || header.id === 'description' })}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn({ 'hidden md:table-cell': cell.column.id === 'id' || cell.column.id === 'description' })}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-xs text-muted-foreground py-4 flex-1 '>
            {t('showing')} <strong>{table.getPaginationRowModel().rows.length}</strong> {t('of')}{' '}
            <strong>{data.length}</strong> {t('results')}
          </div>
          <div>
            <AutoPagination page={table.getState().pagination.pageIndex + 1} pageSize={table.getPageCount()} pathname='/manage/dishes' />
          </div>
        </div>
      </div>
    </DishTableContext.Provider>
  )
}
