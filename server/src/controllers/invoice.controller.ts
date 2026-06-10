import type { Order } from '@prisma/client'
import {
  generatePdfInvoice,
  generateInvoiceNumber,
  calculateInvoiceTotals,
  InvoiceItem,
  InvoiceData,
  ensureInvoicesDirectory,
  InvoiceLocale,
  InvoicePaymentQrData
} from '@/utils/invoice'

export const prepareInvoiceDataFromOrders = (
  orders: (Order & { dishSnapshot: any; guest: any })[],
  locale: InvoiceLocale = 'vi'
): InvoiceData => {
  ensureInvoicesDirectory()

  const invoiceNumber = generateInvoiceNumber()
  const firstOrder = orders[0]
  const invoiceCreatedAt =
    [...orders]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      )[0]?.updatedAt || firstOrder.createdAt

  const items: InvoiceItem[] = orders.map((order) => ({
    name: order.dishSnapshot.name,
    quantity: order.quantity,
    price: order.dishSnapshot.price
  }))

  const { subtotal, tax, total } = calculateInvoiceTotals(items)

  return {
    invoiceNumber,
    guestName: firstOrder.guest?.name || (locale === 'en' ? 'Customer' : 'Khách hàng'),
    tableNumber: firstOrder.tableNumber || 0,
    items,
    subtotal,
    tax,
    total,
    createdAt: invoiceCreatedAt,
    restaurantName: 'BiteHub Restaurant',
    restaurantAddress: '123 Duong ABC, TP. HCM',
    restaurantPhone: '0123 456 789',
    locale
  }
}

export const generateInvoiceFromOrdersController = async (
  orders: (Order & { dishSnapshot: any; guest: any })[],
  locale: InvoiceLocale = 'vi'
): Promise<{ invoiceNumber: string; invoiceUrl: string; paymentQr: InvoicePaymentQrData | null }> => {
  if (orders.length === 0) {
    throw new Error(locale === 'en' ? 'No orders found to generate invoice' : 'Không có đơn hàng nào để tạo hóa đơn')
  }

  const invoiceData = prepareInvoiceDataFromOrders(orders, locale)
  const { invoiceUrl, paymentQr } = await generatePdfInvoice(invoiceData)

  return {
    invoiceNumber: invoiceData.invoiceNumber,
    invoiceUrl,
    paymentQr
  }
}
