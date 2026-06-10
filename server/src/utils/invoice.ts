import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { formatDate } from './helpers'
import envConfig from '@/config'

export type InvoiceLocale = 'vi' | 'en'

export interface InvoiceItem {
  name: string
  quantity: number
  price: number
}

export interface InvoicePaymentQrConfig {
  bankId: string
  accountNo: string
  accountName: string
  template?: string
  transferPrefix?: string
}

export interface InvoicePaymentQrData extends InvoicePaymentQrConfig {
  amount: number
  transferContent: string
  imageUrl: string
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
  locale?: InvoiceLocale
  paymentQrConfig?: Partial<InvoicePaymentQrConfig>
}

export const ensureInvoicesDirectory = () => {
  const invoicesDir = path.join(process.cwd(), 'uploads/invoices')
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true })
  }
  return invoicesDir
}

const resolveInvoiceFonts = () => {
  const regularCandidates = [
    path.join(process.cwd(), 'assets/fonts/Geist-Regular.ttf'),
    path.join(__dirname, '../assets/fonts/Geist-Regular.ttf'),
    path.join(process.cwd(), 'src/assets/fonts/DejaVuSans.ttf'),
    path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf'),
    path.join(__dirname, '../assets/fonts/DejaVuSans.ttf'),
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/TTF/DejaVuSans.ttf',
    '/usr/local/share/fonts/DejaVuSans.ttf',
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/tahoma.ttf'
  ]
  const boldCandidates = [
    path.join(process.cwd(), 'assets/fonts/Geist-Bold.ttf'),
    path.join(__dirname, '../assets/fonts/Geist-Bold.ttf'),
    path.join(process.cwd(), 'src/assets/fonts/DejaVuSans-Bold.ttf'),
    path.join(process.cwd(), 'assets/fonts/DejaVuSans-Bold.ttf'),
    path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf'),
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    '/usr/local/share/fonts/DejaVuSans-Bold.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    'C:/Windows/Fonts/tahomabd.ttf'
  ]

  const regular = regularCandidates.find((fontPath) => fs.existsSync(fontPath))
  const bold = boldCandidates.find((fontPath) => fs.existsSync(fontPath)) || regular

  return regular && bold ? { regular, bold } : null
}

export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `INV-${timestamp}-${random}`
}

export const formatCurrency = (amount: number, locale: InvoiceLocale = 'vi'): string => {
  const formattedAmount = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    maximumFractionDigits: 0
  }).format(amount)
  return `${formattedAmount} đ`
}

const removeVietnameseDiacritics = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')

const getInvoiceText = (locale: InvoiceLocale, useUnicode: boolean) => {
  if (locale === 'en') {
    return {
      title: 'INVOICE',
      invoiceNumber: 'Invoice No.',
      date: 'Date',
      customer: 'Customer',
      table: 'Table',
      dish: 'Dish',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      amount: 'Amount',
      subtotal: 'Subtotal',
      tax: 'Tax (10%)',
      total: 'TOTAL',
      paymentTitle: 'Payment QR',
      paymentHint: 'Scan the QR code below to pay this bill.',
      paymentBank: 'Bank:',
      paymentAccount: 'Account:',
      paymentName: 'Recipient:',
      paymentAmount: 'Amount:',
      paymentReference: 'Content:',
      footer1: 'Thank you for dining with us!',
      footer2: 'Please keep this invoice for any future reference.'
    }
  }

  const text = {
    title: 'HÓA ĐƠN',
    invoiceNumber: 'Số HĐ',
    date: 'Ngày',
    customer: 'Khách hàng',
    table: 'Bàn số',
    dish: 'Món ăn',
    quantity: 'SL',
    unitPrice: 'Đơn giá',
    amount: 'Thành tiền',
    subtotal: 'Tổng cộng',
    tax: 'Thuế (10%)',
    total: 'TỔNG CỘNG',
    paymentTitle: 'Mã QR thanh toán',
    paymentHint: 'Quét mã QR bên dưới để thanh toán hóa đơn này.',
    paymentBank: 'Ngân hàng:',
    paymentAccount: 'Số tài khoản:',
    paymentName: 'Người nhận:',
    paymentAmount: 'Số tiền:',
    paymentReference: 'Nội dung:',
    footer1: 'Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!',
    footer2: 'Vui lòng lưu lại hóa đơn này để đối chiếu khi cần.'
  }

  if (useUnicode) return text

  return Object.fromEntries(
    Object.entries(text).map(([key, value]) => [key, removeVietnameseDiacritics(value)])
  ) as typeof text
}

const formatInvoiceDate = (date: Date, locale: InvoiceLocale) => {
  if (locale === 'en') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  return formatDate(date)
}

const normalizePaymentPrefix = (value?: string) => value?.trim() || 'Thanh toan don hang'

const normalizeVietQrBankId = (value?: string) => {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!normalized) return ''

  const aliases: Record<string, string> = {
    TPBANK: 'TPB',
    TPB: 'TPB',
    MBBANK: 'MB',
    MBB: 'MB',
    VIETCOMBANK: 'VCB',
    VIETINBANK: 'VTB',
    BIDV: 'BIDV',
    AGRIBANK: 'VARB',
    TECHCOMBANK: 'TCB',
    ACB: 'ACB',
    SACOMBANK: 'STB',
    VPBANK: 'VPB',
    SHB: 'SHB',
    HDBANK: 'HDB',
    OCB: 'OCB',
    EXIMBANK: 'EIB',
    VIB: 'VIB',
    MSB: 'MSB',
    SEABANK: 'SSB',
    LPBANK: 'LPB',
    PGBANK: 'PGB',
    KIENLONGBANK: 'KLB',
    NAMABANK: 'NAB',
    VIETABANK: 'VAB',
    ABBANK: 'ABBANK',
    PVCOMBANK: 'PVCB',
    PUBLICBANK: 'PBVN',
    WOORIBANK: 'WB',
    UOB: 'UOB',
    CIMB: 'CIMB',
    KBANK: 'KBANK'
  }

  return aliases[normalized] || normalized
}

const buildVietQrImageUrl = (config: InvoicePaymentQrData) => {
  const template = config.template?.trim() || 'compact2'
  const baseUrl = 'https://img.vietqr.io/image'
  const queryParams = new URLSearchParams({
    amount: String(Math.max(0, Math.round(config.amount))),
    addInfo: config.transferContent,
    accountName: config.accountName
  })

  return `${baseUrl}/${encodeURIComponent(normalizeVietQrBankId(config.bankId))}-${encodeURIComponent(config.accountNo)}-${encodeURIComponent(template)}.png?${queryParams.toString()}`
}

export const buildInvoicePaymentQrData = (
  invoiceNumber: string,
  amount: number,
  overrides?: Partial<InvoicePaymentQrConfig>
): InvoicePaymentQrData | null => {
  const bankId = normalizeVietQrBankId(overrides?.bankId || envConfig.VIETQR_BANK_ID)
  const accountNo = overrides?.accountNo?.trim() || envConfig.VIETQR_ACCOUNT_NO?.trim()
  const accountName = overrides?.accountName?.trim() || envConfig.VIETQR_ACCOUNT_NAME?.trim()
  const template = overrides?.template?.trim() || envConfig.VIETQR_TEMPLATE?.trim() || 'compact2'
  const transferPrefix = normalizePaymentPrefix(overrides?.transferPrefix || envConfig.VIETQR_TRANSFER_PREFIX)

  if (!bankId || !accountNo || !accountName || amount <= 0) {
    return null
  }

  const transferContent = `${transferPrefix} #${invoiceNumber} - BiteHub`

  return {
    bankId,
    accountNo,
    accountName,
    template,
    transferPrefix,
    amount,
    transferContent,
    imageUrl: buildVietQrImageUrl({
      bankId,
      accountNo,
      accountName,
      template,
      transferPrefix,
      amount,
      transferContent,
      imageUrl: ''
    })
  }
}

export const generatePdfInvoice = async (
  invoiceData: InvoiceData
): Promise<{ invoiceUrl: string; paymentQr: InvoicePaymentQrData | null }> => {
  const invoicesDir = ensureInvoicesDirectory()
  const fonts = resolveInvoiceFonts()
  const useUnicodeFonts = Boolean(fonts)
  const locale: InvoiceLocale = invoiceData.locale === 'en' ? 'en' : 'vi'
  const t = getInvoiceText(locale, useUnicodeFonts)

  const doc = new PDFDocument({ size: 'A4', margin: 48 })
  const fileName = `${invoiceData.invoiceNumber}.pdf`
  const filePath = path.join(invoicesDir, fileName)
  const stream = fs.createWriteStream(filePath)
  doc.pipe(stream)

  if (fonts) {
    doc.registerFont('InvoiceRegular', fonts.regular)
    doc.registerFont('InvoiceBold', fonts.bold)
  }

  const regularFont = fonts ? 'InvoiceRegular' : 'Helvetica'
  const boldFont = fonts ? 'InvoiceBold' : 'Helvetica-Bold'
  const invoiceGuestName = useUnicodeFonts ? invoiceData.guestName : removeVietnameseDiacritics(invoiceData.guestName)
  const invoiceItems = invoiceData.items.map((item) => ({
    ...item,
    name: useUnicodeFonts ? item.name : removeVietnameseDiacritics(item.name)
  }))
  const paymentQr = buildInvoicePaymentQrData(invoiceData.invoiceNumber, invoiceData.total, invoiceData.paymentQrConfig)
  let paymentQrImage: Buffer | null = null
  if (paymentQr) {
    try {
      const response = await axios.get(paymentQr.imageUrl, {
        responseType: 'arraybuffer'
      })
      paymentQrImage = Buffer.from(response.data)
    } catch (error) {
      console.error('Failed to load VietQR image:', error)
    }
  }

  const pageWidth = doc.page.width
  const margin = 48
  const contentWidth = pageWidth - margin * 2
  const rightEdge = pageWidth - margin

  doc.fillColor('#111827').font(boldFont).fontSize(30).text(invoiceData.restaurantName || 'BiteHub', margin, 48, {
    width: contentWidth,
    align: 'center'
  })
  doc.font(regularFont).fontSize(11).fillColor('#4b5563')
  doc.text(invoiceData.restaurantAddress || '', margin, 86, { width: contentWidth, align: 'center' })
  doc.text(invoiceData.restaurantPhone || '', margin, 102, { width: contentWidth, align: 'center' })

  doc.moveTo(margin, 126).lineTo(rightEdge, 126).lineWidth(1).strokeColor('#e5e7eb').stroke()

  doc.fillColor('#111827').font(boldFont).fontSize(20).text(t.title, margin, 140, {
    width: contentWidth,
    align: 'center'
  })

  const infoTop = 180
  const leftInfoX = margin
  const rightInfoX = margin + contentWidth / 2
  const lineGap = 22

  const drawInfo = (x: number, y: number, label: string, value: string) => {
    doc.font(regularFont).fontSize(10).fillColor('#6b7280').text(label, x, y, { width: 120 })
    doc.font(boldFont).fontSize(11).fillColor('#111827').text(value, x + 72, y, { width: contentWidth / 2 - 72 })
  }

  drawInfo(leftInfoX, infoTop, `${t.invoiceNumber}:`, invoiceData.invoiceNumber)
  drawInfo(leftInfoX, infoTop + lineGap, `${t.customer}:`, invoiceGuestName)
  drawInfo(rightInfoX, infoTop, `${t.date}:`, formatInvoiceDate(invoiceData.createdAt, locale))
  drawInfo(rightInfoX, infoTop + lineGap, `${t.table}:`, `${invoiceData.tableNumber}`)

  const tableTop = infoTop + 64
  const colDish = margin + 10
  const qtyWidth = 44
  const priceWidth = 92
  const amountWidth = 92
  const colAmount = rightEdge - amountWidth - 8
  const colUnitPrice = colAmount - priceWidth - 10
  const colQty = colUnitPrice - qtyWidth - 10

  doc.rect(margin, tableTop, contentWidth, 30).fill('#f3f4f6')
  doc.fillColor('#111827').font(boldFont).fontSize(11)
  doc.text(t.dish, colDish, tableTop + 8, { width: 280 })
  doc.text(t.quantity, colQty, tableTop + 8, { width: qtyWidth, align: 'right' })
  doc.text(t.unitPrice, colUnitPrice, tableTop + 8, { width: priceWidth, align: 'right' })
  doc.text(t.amount, colAmount, tableTop + 8, { width: amountWidth, align: 'right' })

  let rowY = tableTop + 34
  doc.font(regularFont).fontSize(11).fillColor('#111827')

  invoiceItems.forEach((item, index) => {
    const amount = item.quantity * item.price
    if (index % 2 === 0) {
      doc.rect(margin, rowY - 4, contentWidth, 24).fill('#fafafa')
      doc.fillColor('#111827')
    }

    const dishWidth = colQty - colDish - 16
    doc.text(item.name, colDish, rowY, { width: dishWidth, ellipsis: true })
    doc.text(String(item.quantity), colQty, rowY, { width: qtyWidth, align: 'right' })
    doc.text(formatCurrency(item.price, locale), colUnitPrice, rowY, { width: priceWidth, align: 'right' })
    doc.text(formatCurrency(amount, locale), colAmount, rowY, { width: amountWidth, align: 'right' })

    rowY += 24
  })

  doc.moveTo(margin, rowY + 2).lineTo(rightEdge, rowY + 2).lineWidth(1).strokeColor('#e5e7eb').stroke()

  const totalsTop = rowY + 18
  const totalsValueWidth = 120
  const totalsLabelWidth = 130
  const valueX = rightEdge - totalsValueWidth
  const labelX = valueX - totalsLabelWidth - 10

  const drawTotalRow = (label: string, value: string, y: number, bold = false) => {
    doc.font(bold ? boldFont : regularFont).fontSize(bold ? 15 : 12).fillColor('#111827')
    doc.text(`${label}:`, labelX, y, { width: totalsLabelWidth, align: 'right' })
    doc.text(value, valueX, y, { width: totalsValueWidth, align: 'right' })
  }

  drawTotalRow(t.subtotal, formatCurrency(invoiceData.subtotal, locale), totalsTop)
  drawTotalRow(t.tax, formatCurrency(invoiceData.tax, locale), totalsTop + 24)

  doc.moveTo(labelX - 10, totalsTop + 52).lineTo(rightEdge, totalsTop + 52).lineWidth(1).strokeColor('#e5e7eb').stroke()
  drawTotalRow(t.total, formatCurrency(invoiceData.total, locale), totalsTop + 62, true)

  let footerY = totalsTop + 118

  if (paymentQr) {
    const paymentTop = totalsTop + 108
    const paymentHeight = 150
    const paymentBoxWidth = contentWidth
    const paymentQrWidth = 118
    const paymentQrX = rightEdge - paymentQrWidth - 4
    const paymentTextX = margin
    const paymentTextWidth = paymentQrX - paymentTextX - 18

    doc.roundedRect(margin, paymentTop, paymentBoxWidth, paymentHeight, 8).fillAndStroke('#f9fafb', '#e5e7eb')
    doc.fillColor('#111827').font(boldFont).fontSize(12).text(t.paymentTitle, paymentTextX + 12, paymentTop + 10, {
      width: paymentTextWidth,
      align: 'left'
    })
    doc.font(regularFont).fontSize(9.5).fillColor('#4b5563').text(t.paymentHint, paymentTextX + 12, paymentTop + 28, {
      width: paymentTextWidth,
      align: 'left'
    })

    const paymentLines = [
      `${t.paymentBank} ${paymentQr.bankId}`,
      `${t.paymentAccount} ${paymentQr.accountNo}`,
      `${t.paymentName} ${paymentQr.accountName}`,
      `${t.paymentAmount} ${formatCurrency(paymentQr.amount, locale)}`,
      `${t.paymentReference} ${paymentQr.transferContent}`
    ]

    let paymentLineY = paymentTop + 48
    paymentLines.forEach((line) => {
      doc.font(regularFont).fontSize(9.5).fillColor('#111827').text(line, paymentTextX + 12, paymentLineY, {
        width: paymentTextWidth,
        lineGap: 2
      })
      paymentLineY += 16
    })

    if (paymentQrImage) {
      doc.image(paymentQrImage, paymentQrX, paymentTop + 12, {
        width: paymentQrWidth,
        height: paymentQrWidth
      })
    } else {
      doc.roundedRect(paymentQrX, paymentTop + 12, paymentQrWidth, paymentQrWidth, 6).strokeColor('#d1d5db').stroke()
      doc.font(regularFont).fontSize(8).fillColor('#6b7280').text('QR unavailable', paymentQrX + 8, paymentTop + 58, {
        width: paymentQrWidth - 16,
        align: 'center'
      })
    }

    footerY = paymentTop + paymentHeight + 16
  }

  doc.moveTo(margin, footerY).lineTo(rightEdge, footerY).lineWidth(1).strokeColor('#e5e7eb').stroke()
  doc.font(regularFont).fontSize(10).fillColor('#4b5563')
  doc.text(t.footer1, margin, footerY + 18, { width: contentWidth, align: 'center' })
  doc.text(t.footer2, margin, footerY + 34, { width: contentWidth, align: 'center' })

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve({ invoiceUrl: `/static/invoices/${fileName}`, paymentQr }))
    stream.on('error', reject)
    doc.on('error', reject)
    doc.end()
  })
}

export const calculateInvoiceTotals = (items: InvoiceItem[], taxPercentage: number = 10) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * (taxPercentage / 100))
  const total = subtotal + tax

  return { subtotal, tax, total }
}
