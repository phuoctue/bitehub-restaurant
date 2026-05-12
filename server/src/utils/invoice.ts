import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { formatDate } from './helpers'

export interface InvoiceItem {
  name: string
  quantity: number
  price: number
}

export interface InvoiceData {
  invoiceNumber: string
  guestName: string
  tableNumber: number
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  createdAt: Date
  restaurantName?: string
  restaurantAddress?: string
  restaurantPhone?: string
}

/**
 * Create invoices directory if it doesn't exist
 */
export const ensureInvoicesDirectory = () => {
  const invoicesDir = path.join(process.cwd(), 'uploads/invoices')
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true })
  }
  return invoicesDir
}

/**
 * Resolve a Unicode font with Vietnamese support for PDF rendering.
 * Priority: custom fonts in project -> common Windows fonts.
 */
const resolveInvoiceFonts = () => {
  const regularCandidates = [
    path.join(process.cwd(), 'src/assets/fonts/DejaVuSans.ttf'),
    path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf'),
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/tahoma.ttf'
  ]
  const boldCandidates = [
    path.join(process.cwd(), 'src/assets/fonts/DejaVuSans-Bold.ttf'),
    path.join(process.cwd(), 'assets/fonts/DejaVuSans-Bold.ttf'),
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    'C:/Windows/Fonts/tahomabd.ttf'
  ]

  const regular = regularCandidates.find((fontPath) => fs.existsSync(fontPath))
  const bold = boldCandidates.find((fontPath) => fs.existsSync(fontPath))

  if (!regular || !bold) {
    throw new Error('Không tìm thấy font Unicode hỗ trợ tiếng Việt để tạo hóa đơn PDF')
  }

  return { regular, bold }
}

/**
 * Generate a unique invoice number
 */
export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `INV-${timestamp}-${random}`
}

/**
 * Format currency to Vietnamese Dong
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

/**
 * Generate PDF invoice and save to disk
 */
export const generatePdfInvoice = (invoiceData: InvoiceData): string => {
  const invoicesDir = ensureInvoicesDirectory()
  const fonts = resolveInvoiceFonts()

  // Create new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  })

  // Generate filename
  const fileName = `${invoiceData.invoiceNumber}.pdf`
  const filePath = path.join(invoicesDir, fileName)

  // Pipe to file
  const stream = fs.createWriteStream(filePath)
  doc.pipe(stream)
  doc.registerFont('InvoiceRegular', fonts.regular)
  doc.registerFont('InvoiceBold', fonts.bold)

  // Restaurant Header
  doc.fontSize(20).font('InvoiceBold').text(invoiceData.restaurantName || 'BiteHub', {
    align: 'center'
  })

  doc.fontSize(11).font('InvoiceRegular').text(invoiceData.restaurantAddress || '', {
    align: 'center'
  })

  doc.fontSize(11).text(invoiceData.restaurantPhone || '', {
    align: 'center'
  })

  // Invoice Title
  doc.moveDown(0.5)
  doc.fontSize(14).font('InvoiceBold').text('HÓA ĐƠN', {
    align: 'center'
  })
  doc.moveDown(0.5)

  // Invoice Info Section
  doc.fontSize(10).font('InvoiceRegular')

  doc.text('Số HĐ:', { continued: true }).font('InvoiceBold').text(invoiceData.invoiceNumber)
  doc.font('InvoiceRegular').text('Ngày:', { continued: true }).font('InvoiceBold').text(formatDate(invoiceData.createdAt))

  doc.font('InvoiceRegular').text('Khách hàng:', { continued: true }).font('InvoiceBold').text(invoiceData.guestName)
  doc.font('InvoiceRegular').text('Bàn số:', { continued: true }).font('InvoiceBold').text(invoiceData.tableNumber.toString())

  // Divider
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()

  // Table Header
  const tableTop = doc.y + 10
  const itemCol = 50
  const quantityCol = 350
  const priceCol = 420
  const amountCol = 480

  doc.fontSize(10).font('InvoiceBold')
  doc.text('Món ăn', itemCol, tableTop)
  doc.text('SL', quantityCol, tableTop, { width: 50, align: 'right' })
  doc.text('Đơn giá', priceCol, tableTop, { width: 50, align: 'right' })
  doc.text('Thành tiền', amountCol, tableTop, { width: 50, align: 'right' })

  // Divider
  doc.moveTo(itemCol, doc.y + 5).lineTo(550, doc.y + 5).stroke()

  // Table Items
  let tableItemTop = doc.y + 10
  doc.fontSize(10).font('InvoiceRegular')

  invoiceData.items.forEach((item) => {
    const itemAmount = item.quantity * item.price

    // Item name with wrapping
    const itemNameLines = doc.heightOfString(item.name, {
      width: 280,
      align: 'left'
    })

    doc.text(item.name, itemCol, tableItemTop, { width: 280, align: 'left' })
    doc.text(item.quantity.toString(), quantityCol, tableItemTop, { width: 50, align: 'right' })
    doc.text(formatCurrency(item.price), priceCol, tableItemTop, { width: 50, align: 'right' })
    doc.text(formatCurrency(itemAmount), amountCol, tableItemTop, { width: 50, align: 'right' })

    tableItemTop = doc.y + 5
  })

  // Divider
  doc.moveTo(itemCol, doc.y + 5).lineTo(550, doc.y + 5).stroke()

  // Totals Section
  const totalTop = doc.y + 10
  const labelCol = 350
  const valueCol = 480

  doc.fontSize(10).font('InvoiceRegular')
  doc.text('Tổng cộng:', labelCol, totalTop, { width: 100, align: 'right' })
  doc.text(formatCurrency(invoiceData.subtotal), valueCol, totalTop, { width: 50, align: 'right' })

  doc.text('Thuế (10%):', labelCol, doc.y, { width: 100, align: 'right' })
  doc.text(formatCurrency(invoiceData.tax), valueCol, doc.y, { width: 50, align: 'right' })

  // Total Amount
  doc.fontSize(12).font('InvoiceBold')
  const totalLineY = doc.y + 10
  doc.text('TỔNG CỘNG:', labelCol, totalLineY, { width: 100, align: 'right' })
  doc.text(formatCurrency(invoiceData.total), valueCol, totalLineY, { width: 50, align: 'right' })

  // Divider
  doc.moveTo(itemCol, doc.y + 10).lineTo(550, doc.y + 10).stroke()

  // Footer
  doc.fontSize(9).font('InvoiceRegular').text('Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!', 50, doc.y + 20, {
    align: 'center',
    width: 500
  })

  doc.text('Vui lòng lưu lại hóa đơn này để khi có tranh chấp.', {
    align: 'center',
    width: 500
  })

  // Finalize PDF
  doc.end()

  // Return path for accessing the invoice via HTTP
  // Files are served from /static/ route which maps to UPLOAD_FOLDER
  return `/static/invoices/${fileName}`
}

/**
 * Calculate tax and total for invoice items
 */
export const calculateInvoiceTotals = (items: InvoiceItem[], taxPercentage: number = 10) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * (taxPercentage / 100))
  const total = subtotal + tax

  return {
    subtotal,
    tax,
    total
  }
}
