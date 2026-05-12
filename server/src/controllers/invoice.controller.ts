import { Order } from '@prisma/client'
import {
  generatePdfInvoice,
  generateInvoiceNumber,
  calculateInvoiceTotals,
  InvoiceItem,
  InvoiceData,
  ensureInvoicesDirectory
} from '@/utils/invoice'

/**
 * Prepare invoice data from paid orders
 */
export const prepareInvoiceDataFromOrders = (orders: (Order & { dishSnapshot: any; guest: any })[]): InvoiceData => {
  ensureInvoicesDirectory()

  const invoiceNumber = generateInvoiceNumber()
  const firstOrder = orders[0]

  // Convert orders to invoice items
  const items: InvoiceItem[] = orders.map((order) => ({
    name: order.dishSnapshot.name,
    quantity: order.quantity,
    price: order.dishSnapshot.price
  }))

  // Calculate totals
  const { subtotal, tax, total } = calculateInvoiceTotals(items)

  const invoiceData: InvoiceData = {
    invoiceNumber,
    guestName: firstOrder.guest?.name || 'Khách hàng',
    tableNumber: firstOrder.tableNumber || 0,
    items,
    subtotal,
    tax,
    total,
    createdAt: new Date(),
    restaurantName: 'BiteHub Restaurant',
    restaurantAddress: '123 Đường ABC, TP. HCM',
    restaurantPhone: '0123 456 789'
  }

  return invoiceData
}

/**
 * Generate invoice PDF from paid orders
 */
export const generateInvoiceFromOrdersController = (
  orders: (Order & { dishSnapshot: any; guest: any })[]
): { invoiceNumber: string; invoiceUrl: string } => {
  if (orders.length === 0) {
    throw new Error('Không có đơn hàng nào để tạo hóa đơn')
  }

  // Prepare invoice data
  const invoiceData = prepareInvoiceDataFromOrders(orders)

  // Generate PDF
  const invoiceUrl = generatePdfInvoice(invoiceData)

  return {
    invoiceNumber: invoiceData.invoiceNumber,
    invoiceUrl
  }
}
