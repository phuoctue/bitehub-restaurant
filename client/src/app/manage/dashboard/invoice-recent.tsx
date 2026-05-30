'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useInvoice } from '@/queries/useInvoice'
import { useGetOrderListQuery } from '@/queries/useOrder'
import { useMemo } from 'react'
import { formatCurrency, formatDateTimeToLocaleString, handleErrorApi } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/components/app-provider'
import { Role } from '@/constants/type'
import { GetOrdersResType } from '@/schemaValidations/order.schema'
import orderApiRequest from '@/apiRequest/order'
import { useTranslations } from 'next-intl'

export function InvoiceRecent() {
  const t = useTranslations('ManageDashboard')
  const { downloadInvoice, printInvoice, isDownloading } = useInvoice()
  const role = useAppStore((state) => state.role)
  const canViewInvoices = role === Role.Owner || role === Role.Employee

  const recentRange = useMemo(
    () => ({
      fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      toDate: new Date()
    }),
    []
  )

  const { data: ordersData, isLoading } = useGetOrderListQuery(recentRange, canViewInvoices)
  const allOrders: GetOrdersResType['data'] = ordersData?.payload.data ?? []

  const invoices = useMemo(() => {
    if (!allOrders.length) return []

    const paidOrders = allOrders.filter((order) => order.status === 'Paid')
    const groupedByGuest = new Map<number | 'unknown', GetOrdersResType['data']>()

    paidOrders.forEach((order) => {
      const guestId = order.guest?.id || 'unknown'
      if (!groupedByGuest.has(guestId)) groupedByGuest.set(guestId, [])
      groupedByGuest.get(guestId)?.push(order)
    })

    const result = Array.from(groupedByGuest.entries()).map(([guestId, orders]) => {
      const firstOrder = orders[0]
      const total = orders.reduce((sum: number, order) => sum + order.dishSnapshot.price * order.quantity, 0)

      return {
        id: guestId,
        orderId: firstOrder.id,
        guestName: firstOrder.guest?.name || t('recentInvoices.guestFallback'),
        tableNumber: firstOrder.tableNumber || 0,
        total,
        itemCount: orders.length,
        createdAt: firstOrder.createdAt
      }
    })

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  }, [allOrders, t])

  if (!canViewInvoices) return null

  if (isLoading) {
    return (
      <Card className='border-slate-800/80 bg-slate-900/40'>
        <CardHeader />
        <CardContent>
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-12 w-full bg-slate-800/80' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-slate-800/80 bg-slate-900/40'>
      <CardHeader>
        <CardTitle className='text-slate-100'>{t('recentInvoices.title')}</CardTitle>
        <CardDescription className='text-slate-400'>{t('recentInvoices.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className='py-8 text-center text-slate-400'>
            <p>{t('recentInvoices.empty')}</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className='flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-900/70 p-3 transition-colors hover:bg-slate-800/80'
              >
                <div className='flex-1'>
                  <p className='text-sm font-semibold text-slate-100'>{invoice.guestName}</p>
                  <p className='text-xs text-slate-400'>
                    {t('recentInvoices.meta', {
                      table: invoice.tableNumber,
                      count: invoice.itemCount,
                      dateTime: formatDateTimeToLocaleString(new Date(invoice.createdAt))
                    })}
                  </p>
                </div>

                <div className='flex items-center gap-2'>
                  <div className='mr-2 text-right'>
                    <p className='text-sm font-bold text-emerald-400'>{formatCurrency(invoice.total)}</p>
                  </div>

                  <div className='flex gap-1'>
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
                      className='border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800'
                      title={t('recentInvoices.downloadTitle')}
                    >
                      <span className='text-lg'>📥</span>
                    </Button>

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
                      className='border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800'
                      title={t('recentInvoices.printTitle')}
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

