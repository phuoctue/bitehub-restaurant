import fs from 'fs'
import crypto from 'crypto'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export const randomId = () => crypto.randomUUID().replace(/-/g, '')
export const createFolder = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
}

export const getChalk = async () => {
  const chalk = (await import('chalk')).default
  return chalk
}

/**
 * Format date to Vietnamese locale
 */
export const formatDate = (date: Date, dateFormat: string = 'dd/MM/yyyy HH:mm'): string => {
  return format(date, dateFormat, { locale: vi })
}

