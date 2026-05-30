
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

export const invoiceApiRequest = {
  // Download invoice PDF
  downloadInvoice: (invoiceUrl: string) => {
    window.open(getInvoiceAbsoluteUrl(invoiceUrl), '_blank')
  },

  // Print invoice
  printInvoice: (invoiceUrl: string) => {
    const printWindow = window.open(getInvoiceAbsoluteUrl(invoiceUrl), 'print', 'width=800,height=600')
    if (printWindow) {
      // Delay a little to make sure PDF viewer is ready before printing.
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print()
        }, 300)
      })
    }
  }
}
