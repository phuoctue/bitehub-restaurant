
import envConfig from '@/config'

export interface InvoiceData {
  invoiceNumber: string
  invoiceUrl: string
  paymentQr?: {
    bankId: string
    accountNo: string
    accountName: string
    template?: string
    transferPrefix?: string
    amount: number
    transferContent: string
    imageUrl: string
  } | null
}

const getInvoiceAbsoluteUrl = (invoiceUrl: string) => {
  if (invoiceUrl.startsWith('http://') || invoiceUrl.startsWith('https://')) {
    return invoiceUrl
  }
  const normalizedInvoicePath = invoiceUrl.startsWith('/') ? invoiceUrl : `/${invoiceUrl}`
  return `${envConfig.NEXT_PUBLIC_API_ENDPOINT}${normalizedInvoicePath}`
}

const buildInvoicePopupFeatures = () =>
  'width=480,height=720,left=80,top=80,resizable=yes,scrollbars=yes'

export const createInvoicePrintPopup = (url = 'about:blank') =>
  window.open(url, 'invoice-print', buildInvoicePopupFeatures())

const renderBlobInvoiceInPopup = async (
  invoiceUrl: string,
  popup: Window | null = null,
) => {
  try {
    const absoluteUrl = getInvoiceAbsoluteUrl(invoiceUrl)

    const nextPopup = popup ?? createInvoicePrintPopup()
    if (!nextPopup) {
      window.open(absoluteUrl, '_blank')
      return
    }

    nextPopup.document.open()
    nextPopup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Invoice Preview</title>
          <style>
            html, body {
              margin: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #fff;
            }
            .loading {
              display: grid;
              place-items: center;
              width: 100%;
              height: 100%;
              font-family: system-ui, sans-serif;
              font-size: 14px;
              color: #111827;
            }
            iframe {
              border: 0;
              width: 100%;
              height: 100%;
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="loading">Đang tải hóa đơn...</div>
          <iframe id="invoice-frame"></iframe>
        </body>
      </html>
    `)
    nextPopup.document.close()

    const response = await fetch(absoluteUrl, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch invoice PDF: ${response.status}`)
    }

    const pdfBlob = await response.blob()
    const blobUrl = URL.createObjectURL(pdfBlob)
    const frame = nextPopup.document.getElementById('invoice-frame') as HTMLIFrameElement | null
    const loading = nextPopup.document.querySelector('.loading') as HTMLElement | null

    if (!frame) {
      throw new Error('Invoice frame is missing')
    }

    frame.src = blobUrl
    frame.style.display = 'block'
    if (loading) {
      loading.style.display = 'none'
    }

    const revokeBlobUrl = () => {
      URL.revokeObjectURL(blobUrl)
    }

    frame.onload = () => {
      try {
        nextPopup.focus()
        setTimeout(() => {
          try {
            nextPopup.print()
          } catch (error) {
            console.error('Failed to print invoice:', error)
          } finally {
            setTimeout(revokeBlobUrl, 5000)
          }
        }, 600)
      } catch (error) {
        console.error('Failed to prepare invoice print popup:', error)
        revokeBlobUrl()
      }
    }

    frame.onerror = () => {
      console.error('Failed to load invoice PDF in popup')
      revokeBlobUrl()
    }
  } catch (error) {
    console.error('Failed to open print window:', error)
  }
}

export const invoiceApiRequest = {
  // Download invoice PDF
  downloadInvoice: (invoiceUrl: string) => {
    window.open(getInvoiceAbsoluteUrl(invoiceUrl), '_blank')
  },

  openPrintWindow: createInvoicePrintPopup,

  // Print invoice using iframe
  printInvoice: (invoiceUrl: string, popup?: Window | null) => {
    void renderBlobInvoiceInPopup(invoiceUrl, popup ?? null)
  }
}
