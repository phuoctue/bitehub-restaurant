'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useInvoice } from '@/queries/useInvoice'
import { useGetOrderListQuery } from '@/queries/useOrder'
import { useMemo } from 'react'
import { formatDateTimeToLocaleString, formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/components/app-provider'
import { Role } from '@/constants/type'
import { GetOrdersResType } from '@/schemaValidations/order.schema'
import orderApiRequest from '@/apiRequest/order'
import { handleErrorApi } from '@/lib/utils'

export function InvoiceRecent() {
  const { downloadInvoice, printInvoice, isDownloading } = useInvoice()
  const role = useAppStore((state) => state.role)
  const canViewInvoices = role === Role.Owner || role === Role.Employee

  const { data: ordersData, isLoading } = useGetOrderListQuery({
    fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày gần đây
    toDate: new Date()
  }, canViewInvoices)
  const allOrders: GetOrdersResType['data'] = ordersData?.payload.data ?? []

  // Lấy danh sách hóa đơn (chỉ những đơn có status Paid)
  const invoices = useMemo(() => {
    if (!allOrders.length) return []

    const paidOrders = allOrders.filter((order) => order.status === 'Paid')

    // Nhóm theo khách hàng để tránh trùng lặp
    const groupedByGuest = new Map<number | 'unknown', GetOrdersResType['data']>()
    paidOrders.forEach((order) => {
      const guestId = order.guest?.id || 'unknown'
      if (!groupedByGuest.has(guestId)) {
        groupedByGuest.set(guestId, [])
      }
      const ordersByGuest = groupedByGuest.get(guestId)
      if (ordersByGuest) {
        ordersByGuest.push(order)
      }
    })

    // Tạo danh sách hóa đơn (mỗi khách = 1 hóa đơn)
    const result = Array.from(groupedByGuest.entries()).map(([guestId, orders]) => {
      const firstOrder = orders[0]
      const total = orders.reduce((sum: number, order) => sum + order.dishSnapshot.price * order.quantity, 0)

      return {
        id: guestId,
        orderId: firstOrder.id,
        guestName: firstOrder.guest?.name || 'Khách hàng',
        tableNumber: firstOrder.tableNumber || 0,
        total,
        itemCount: orders.length,
        createdAt: firstOrder.createdAt
      }
    })

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  }, [allOrders])

  if (!canViewInvoices) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {/* <CardTitle>Hóa đơn gần đây</CardTitle>
          <CardDescription>Danh sách 5 hóa đơn mới nhất</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hóa đơn gần đây</CardTitle>
        <CardDescription>Danh sách 5 hóa đơn mới nhất (7 ngày qua)</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            <p>Chưa có hóa đơn nào</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className='flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50 bg-white'
              >
                <div className='flex-1'>
                  <p className='font-semibold text-sm'>{invoice.guestName}</p>
                  <p className='text-xs text-muted-foreground'>
                    Bàn {invoice.tableNumber} • {invoice.itemCount} món • {formatDateTimeToLocaleString(new Date(invoice.createdAt))}
                  </p>
                </div>

                <div className='flex items-center gap-2'>
                  <div className='text-right mr-2'>
                    <p className='font-bold text-green-600 text-sm'>{formatCurrency(invoice.total)}</p>
                  </div>

                  <div className='flex gap-1'>
                    {/* Nút tải về */}
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={async () => {
                        try {
                          const result = await orderApiRequest.getOrderInvoice(invoice.orderId)
                          downloadInvoice(result.payload.data.invoiceUrl)
                        } catch (error) {
                          handleErrorApi({ error })
                        }
                      }}
                      disabled={isDownloading}
                      title='Tải hóa đơn'
                    >
                      <span className='text-lg'>📥</span>
                    </Button>

                    {/* Nút in */}
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={async () => {
                        try {
                          const result = await orderApiRequest.getOrderInvoice(invoice.orderId)
                          printInvoice(result.payload.data.invoiceUrl)
                        } catch (error) {
                          handleErrorApi({ error })
                        }
                      }}
                      disabled={isDownloading}
                      title='In hóa đơn'
                    >
                      <span className='text-lg'>🖨️</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
