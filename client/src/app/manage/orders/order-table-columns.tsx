'use client'

import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { GetOrdersResType } from '@/schemaValidations/order.schema'
import { useContext } from 'react'
import { formatCurrency, formatDateTimeToLocaleString, simpleMatchText } from '@/lib/utils'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { OrderStatus, OrderStatusValues } from '@/constants/type'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { OrderTableContext } from '@/app/manage/orders/order-table'
import OrderGuestDetail from '@/app/manage/orders/order-guest-detail'
import { useTranslations } from 'next-intl'
import { TranslationValues } from 'next-intl'

type OrderItem = GetOrdersResType['data'][0]

type TOrder = (key: string, values?: TranslationValues) => string

function statusLabel(status: (typeof OrderStatusValues)[number], t: TOrder) {
  return t(`status.${status}`)
}

export default function orderTableColumns(t: TOrder): ColumnDef<OrderItem>[] {
  return [
    {
      accessorKey: 'tableNumber',
      header: t('table'),
      cell: ({ row }) => <div>{row.getValue('tableNumber')}</div>,
      filterFn: (row, columnId, filterValue: string) => {
        if (filterValue === undefined) return true
        return simpleMatchText(String(row.getValue(columnId)), String(filterValue))
      }
    },
    {
      id: 'guestName',
      header: t('customer'),
      cell: function Cell({ row }) {
        const { orderObjectByGuestId } = useContext(OrderTableContext)
        const guest = row.original.guest
        const tLocal = useTranslations('ManageOrders')
        return (
          <div>
            {!guest && (
              <div>
                <span>{tLocal('deleted')}</span>
              </div>
            )}
            {guest && (
              <Popover>
                <PopoverTrigger>
                  <div>
                    <span>{guest.name}</span>
                    <span className='font-semibold'>(#{guest.id})</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className='w-[320px] sm:w-[440px]'>
                  <OrderGuestDetail guest={guest} orders={orderObjectByGuestId[guest.id]} />
                </PopoverContent>
              </Popover>
            )}
          </div>
        )
      },
      filterFn: (row, _columnId, filterValue: string) => {
        if (filterValue === undefined) return true
        return simpleMatchText(row.original.guest?.name ?? t('deleted'), String(filterValue))
      }
    },
    {
      id: 'dishName',
      header: t('dish'),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Image
                src={row.original.dishSnapshot.image}
                alt={row.original.dishSnapshot.name}
                width={50}
                height={50}
                className='rounded-md object-cover w-[50px] h-[50px] cursor-pointer'
              />
            </PopoverTrigger>
            <PopoverContent>
              <div className='flex flex-wrap gap-2'>
                <Image
                  src={row.original.dishSnapshot.image}
                  alt={row.original.dishSnapshot.name}
                  width={100}
                  height={100}
                  className='rounded-md object-cover w-[100px] h-[100px]'
                />
                <div className='space-y-1 text-sm'>
                  <h3 className='font-semibold'>{row.original.dishSnapshot.name}</h3>
                  <div className='italic'>{formatCurrency(row.original.dishSnapshot.price)}</div>
                  <div>{row.original.dishSnapshot.description}</div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <span>{row.original.dishSnapshot.name}</span>
              <Badge className='px-1' variant={'secondary'}>
                x{row.original.quantity}
              </Badge>
            </div>
            <span className='italic'>{formatCurrency(row.original.dishSnapshot.price * row.original.quantity)}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: t('statusLabel'),
      cell: function Cell({ row }) {
        const { changeStatus } = useContext(OrderTableContext)
        const tLocal = useTranslations('ManageOrders')
        const changeOrderStatus = async (status: (typeof OrderStatusValues)[number]) => {
          changeStatus({
            orderId: row.original.id,
            dishId: row.original.dishSnapshot.dishId!,
            status,
            quantity: row.original.quantity
          })
        }
        return (
          <Select
            onValueChange={(value: (typeof OrderStatusValues)[number]) => changeOrderStatus(value)}
            defaultValue={OrderStatus.Pending}
            value={row.getValue('status')}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder={tLocal('statusLabel')} />
            </SelectTrigger>
            <SelectContent>
              {OrderStatusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabel(status, tLocal)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
    },
    {
      id: 'orderHandlerName',
      header: t('handler'),
      cell: ({ row }) => <div>{row.original.orderHandler?.name ?? ''}</div>
    },
    {
      accessorKey: 'createdAt',
      header: () => <div>{t('createdUpdated')}</div>,
      cell: ({ row }) => (
        <div className='space-y-2 text-sm'>
          <div className='flex items-center space-x-4'>{formatDateTimeToLocaleString(row.getValue('createdAt'))}</div>
          <div className='flex items-center space-x-4'>{formatDateTimeToLocaleString(row.original.updatedAt as unknown as string)}</div>
        </div>
      )
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setOrderIdEdit } = useContext(OrderTableContext)
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
              <DropdownMenuItem onClick={() => setOrderIdEdit(row.original.id)}>{t('edit')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}
