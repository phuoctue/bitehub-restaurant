import prisma from '@/database'
import { CreateTableBodyType, UpdateTableBodyType } from '@/schemaValidations/table.schema'
import { TableStatus, TableStatusValues } from '@/constants/type'
import { EntityError, isPrismaClientKnownRequestError } from '@/utils/errors'
import { getExcelValue, normalizeExcelNumber, normalizeExcelText, readExcelRows } from '@/utils/excel-import'
import { randomId } from '@/utils/helpers'
import z from 'zod'

export const getTableList = () => {
  return prisma.table.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getTableDetail = (number: number) => {
  return prisma.table.findUniqueOrThrow({
    where: {
      number
    }
  })
}

export const createTable = async (data: CreateTableBodyType) => {
  const token = randomId()
  try {
    const result = await prisma.table.create({
      data: {
        ...data,
        token
      }
    })
    return result
  } catch (error) {
    if (isPrismaClientKnownRequestError(error) && error.code === 'P2002') {
      throw new EntityError([
        {
          message: 'Số bàn này đã tồn tại',
          field: 'number'
        }
      ])
    }
    throw error
  }
}

export const updateTable = (number: number, data: UpdateTableBodyType) => {
  if (data.changeToken) {
    const token = randomId()
    // Xóa hết các refresh token của guest theo table
    return prisma.$transaction(async (tx) => {
      const [table] = await Promise.all([
        tx.table.update({
          where: {
            number
          },
          data: {
            status: data.status,
            capacity: data.capacity,
            token
          }
        }),
        tx.guest.updateMany({
          where: {
            tableNumber: number
          },
          data: {
            refreshToken: null,
            refreshTokenExpiresAt: null
          }
        })
      ])
      return table
    })
  }
  return prisma.table.update({
    where: {
      number
    },
    data: {
      status: data.status,
      capacity: data.capacity
    }
  })
}

export const deleteTable = (number: number) => {
  return prisma.table.delete({
    where: {
      number
    }
  })
}

const ImportTableRow = z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().positive(),
  status: z.enum(TableStatusValues).optional()
})

const normalizeTableStatus = (value: unknown) => {
  const text = normalizeExcelText(value).toLowerCase()
  if (!text) {
    return undefined
  }

  if ([TableStatus.Available.toLowerCase(), 'trong', 'trống'].includes(text)) {
    return TableStatus.Available
  }

  if ([TableStatus.Hidden.toLowerCase(), 'an', 'ẩn'].includes(text)) {
    return TableStatus.Hidden
  }

  if ([TableStatus.Reserved.toLowerCase(), 'da dat', 'đã đặt'].includes(text)) {
    return TableStatus.Reserved
  }

  return text as (typeof TableStatusValues)[number]
}

export const importTablesFromExcel = async (buffer: Buffer) => {
  const rows = readExcelRows(buffer)
  if (rows.length === 0) {
    throw new Error('File Excel không có dòng dữ liệu nào')
  }

  const existingTables = await getTableList()
  const existingTableNumbers = new Set(existingTables.map((table) => table.number))
  const seenNumbers = new Set<number>()
  const failures: { rowNumber: number; message: string }[] = []
  let successRows = 0

  for (const row of rows) {
    const rawBody = {
      number: normalizeExcelNumber(getExcelValue(row.values, ['number', 'table', 'tablenumber', 'sohieuban', 'soba', 'sốhiệubàn'])),
      capacity: normalizeExcelNumber(getExcelValue(row.values, ['capacity', 'allowedcapacity', 'luongkhachchaphep', 'luongkhach', 'lượngkháchchophép'])),
      status: normalizeTableStatus(getExcelValue(row.values, ['status', 'trangthai', 'trạngthái']))
    }

    const parsed = ImportTableRow.safeParse(rawBody)
    if (!parsed.success) {
      failures.push({
        rowNumber: row.rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(', ')
      })
      continue
    }

    if (existingTableNumbers.has(parsed.data.number) || seenNumbers.has(parsed.data.number)) {
      failures.push({
        rowNumber: row.rowNumber,
        message: 'Bàn đã được đặt'
      })
      continue
    }

    await createTable(parsed.data)

    seenNumbers.add(parsed.data.number)
    successRows += 1
  }

  return {
    totalRows: rows.length,
    successRows,
    failedRows: failures.length,
    failures
  }
}
