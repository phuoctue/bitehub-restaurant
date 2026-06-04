
import envConfig from '@/config'

export interface InvoiceData {
  invoiceNumber: string
  invoiceUrl: string
}

const getInvoiceAbsoluteUrl = (invoiceUrl: string) => {
  if (invoiceUrl.startsWith('http://') || invoiceUrl.startsWith('https://')) {
    return invoiceUrl
  }
  const normalizedInvoicePath = invoiceUrl.startsWith('/') ? invoiceUrl : `/${invoiceUrl}`
  return `${envConfig.NEXT_PUBLIC_API_ENDPOINT}${normalizedInvoicePath}`
}

const printOpenedInvoiceWindow = (printWindow: Window, invoiceUrl: string) => {
  printWindow.addEventListener('load', () => {
    setTimeout(() => {
      printWindow.print()
    }, 300)
  })
  printWindow.location.href = getInvoiceAbsoluteUrl(invoiceUrl)
}

export const invoiceApiRequest = {
  // Download invoice PDF
  downloadInvoice: (invoiceUrl: string) => {
    window.open(getInvoiceAbsoluteUrl(invoiceUrl), '_blank')
  },

  openPrintWindow: () => {
    return window.open('about:blank', 'print', 'width=800,height=600')
  },

  // Print invoice
  printInvoice: (invoiceUrl: string, existingPrintWindow?: Window | null) => {
    const printWindow = existingPrintWindow ?? window.open('about:blank', 'print', 'width=800,height=600')
    if (printWindow) {
      printOpenedInvoiceWindow(printWindow, invoiceUrl)
    }
  }
}
