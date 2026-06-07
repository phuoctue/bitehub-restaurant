
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

const printPdfWithIframe = (invoiceUrl: string) => {
  try {
    const absoluteUrl = getInvoiceAbsoluteUrl(invoiceUrl)
    
    // Create a hidden iframe
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = absoluteUrl
    
    // Handle print after iframe loads
    iframe.onload = () => {
      try {
        setTimeout(() => {
          iframe.contentWindow?.print()
        }, 500)
      } catch (error) {
        console.error('Failed to print from iframe:', error)
      }
    }
    
    // Handle errors
    iframe.onerror = () => {
      console.error('Failed to load PDF in iframe')
      document.body.removeChild(iframe)
    }
    
    document.body.appendChild(iframe)
    
    // Clean up iframe after printing (with delay to allow print dialog)
    setTimeout(() => {
      try {
        document.body.removeChild(iframe)
      } catch (error) {
        console.error('Error removing iframe:', error)
      }
    }, 5000)
  } catch (error) {
    console.error('Failed to open print window:', error)
  }
}

export const invoiceApiRequest = {
  // Download invoice PDF
  downloadInvoice: (invoiceUrl: string) => {
    window.open(getInvoiceAbsoluteUrl(invoiceUrl), '_blank')
  },

  openPrintWindow: () => {
    return window.open('about:blank', 'print', 'width=800,height=600')
  },

  // Print invoice using iframe
  printInvoice: (invoiceUrl: string) => {
    printPdfWithIframe(invoiceUrl)
  }
}
