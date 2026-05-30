import xlsx from 'xlsx'

export type ExcelRow = {
  rowNumber: number
  values: Record<string, unknown>
}

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const normalizeExcelHeader = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return removeDiacritics(String(value).trim().toLowerCase())
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '')
}

export const normalizeExcelText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

export const normalizeExcelNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return Number.NaN
  }

  if (typeof value === 'number') {
    return value
  }

  const normalized = String(value).trim().replace(/[.,\s]/g, '')
  return Number(normalized)
}

export const readExcelRows = (buffer: Buffer): ExcelRow[] => {
  const workbook = xlsx.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('File Excel không có trang dữ liệu nào')
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: ''
  })

  if (rawRows.length === 0) {
    throw new Error('File Excel không có dữ liệu')
  }

  const [headerRow = [], ...dataRows] = rawRows
  const headers = headerRow.map(normalizeExcelHeader)

  if (headers.every((header) => !header)) {
    throw new Error('File Excel phải có hàng tiêu đề')
  }

  return dataRows
    .map((row, rowIndex) => {
      const values: Record<string, unknown> = {}

      headers.forEach((header, columnIndex) => {
        if (header) {
          values[header] = row[columnIndex]
        }
      })

      return {
        rowNumber: rowIndex + 2,
        values
      }
    })
    .filter((row) => Object.values(row.values).some((value) => normalizeExcelText(value) !== ''))
}

export const readExcelHeaders = (buffer: Buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('File Excel không có trang dữ liệu nào')
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: ''
  })

  if (rawRows.length === 0) {
    throw new Error('File Excel không có dữ liệu')
  }

  const [headerRow = []] = rawRows
  const headers = headerRow.map(normalizeExcelHeader).filter((header) => header !== '')

  if (headers.length === 0) {
    throw new Error('File Excel phải có hàng tiêu đề')
  }

  return headers
}

export const assertExcelHeaders = (
  headers: string[],
  requiredHeaderGroups: string[][],
  fileLabel: string
) => {
  const normalizedHeaders = new Set(headers.map(normalizeExcelHeader))
  const missingHeaders = requiredHeaderGroups.filter((group) => !group.some((alias) => normalizedHeaders.has(normalizeExcelHeader(alias))))

  if (missingHeaders.length > 0) {
    throw new Error(`${fileLabel} không đúng mẫu import`)
  }
}

export const getExcelValue = (row: Record<string, unknown>, aliases: string[]) => {
  const aliasSet = new Set(aliases.map(normalizeExcelHeader))

  for (const [key, value] of Object.entries(row)) {
    if (aliasSet.has(normalizeExcelHeader(key))) {
      return value
    }
  }

  return undefined
}
