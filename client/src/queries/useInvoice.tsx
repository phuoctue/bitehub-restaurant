'use client'

import { invoiceApiRequest } from '@/apiRequest/invoice'
import { useState } from 'react'

export const useInvoice = () => {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadInvoice = (invoiceUrl: string) => {
    try {
      setIsDownloading(true)
      invoiceApiRequest.downloadInvoice(invoiceUrl)
    } catch (error) {
      console.error('Failed to download invoice:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const printInvoice = (invoiceUrl: string) => {
    try {
      setIsDownloading(true)
      invoiceApiRequest.printInvoice(invoiceUrl)
    } catch (error) {
      console.error('Failed to print invoice:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return {
    downloadInvoice,
    printInvoice,
    isDownloading
  }
}
