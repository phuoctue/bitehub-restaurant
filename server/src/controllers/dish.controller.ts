import prisma from '@/database'
import { CreateDishBodyType, UpdateDishBodyType } from '@/schemaValidations/dish.schema'
import { DishStatus, DishStatusValues } from '@/constants/type'
import { getExcelValue, normalizeExcelNumber, normalizeExcelText, readExcelRows } from '@/utils/excel-import'
import z from 'zod'

export const getDishList = () => {
  return prisma.dish.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getDishDetail = (id: number) => {
  return prisma.dish.findUniqueOrThrow({
    where: {
      id
    }
  })
}

export const createDish = (data: CreateDishBodyType) => {
  return prisma.dish.create({
    data
  })
}

export const updateDish = (id: number, data: UpdateDishBodyType) => {
  return prisma.dish.update({
    where: {
      id
    },
    data
  })
}

export const deleteDish = (id: number) => {
  return prisma.dish.delete({
    where: {
      id
    }
  })
}

const ImportDishRow = z.object({
  name: z.string().min(1).max(256),
  price: z.number().int().positive(),
  description: z.string().max(10000),
  image: z.union([z.string().url(), z.literal('')]).optional().default(''),
  status: z.enum(DishStatusValues).optional()
})

const normalizeDishStatus = (value: unknown) => {
  const text = normalizeExcelText(value).toLowerCase()
  if (!text) {
    return undefined
  }

  if ([DishStatus.Available.toLowerCase(), 'con ban', 'còn bán'].includes(text)) {
    return DishStatus.Available
  }

  if ([DishStatus.Unavailable.toLowerCase(), 'het mon', 'hết món'].includes(text)) {
    return DishStatus.Unavailable
  }

  if ([DishStatus.Hidden.toLowerCase(), 'an', 'ẩn'].includes(text)) {
    return DishStatus.Hidden
  }

  return text as (typeof DishStatusValues)[number]
}

export const importDishesFromExcel = async (buffer: Buffer) => {
  const rows = readExcelRows(buffer)
  if (rows.length === 0) {
    throw new Error('File Excel không có dòng dữ liệu nào')
  }

  const existingDishes = await getDishList()
  const existingDishNames = new Set(existingDishes.map((dish) => dish.name.trim().toLowerCase()))
  const seenNames = new Set<string>()
  const failures: { rowNumber: number; message: string }[] = []
  let successRows = 0

  for (const row of rows) {
    const rawBody = {
      name: getExcelValue(row.values, ['name', 'dishname', 'tenmonan', 'tênmónăn']),
      price: normalizeExcelNumber(getExcelValue(row.values, ['price', 'pricevnd', 'gia', 'giavn', 'giá', 'giavnđ'])),
      description: getExcelValue(row.values, ['description', 'mota', 'môtả', 'motamonan']),
      image: getExcelValue(row.values, ['image', 'anh', 'imageurl', 'urlanh']),
      status: normalizeDishStatus(getExcelValue(row.values, ['status', 'trangthai', 'trạngthái']))
    }

    const parsed = ImportDishRow.safeParse(rawBody)
    if (!parsed.success) {
      failures.push({
        rowNumber: row.rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(', ')
      })
      continue
    }

    const dishName = parsed.data.name.trim().toLowerCase()
    if (existingDishNames.has(dishName) || seenNames.has(dishName)) {
      failures.push({
        rowNumber: row.rowNumber,
        message: 'Món đã có'
      })
      continue
    }

    await createDish({
      ...parsed.data,
      image: normalizeExcelText(parsed.data.image)
    })

    seenNames.add(dishName)
    successRows += 1
  }

  return {
    totalRows: rows.length,
    successRows,
    failedRows: failures.length,
    failures
  }
}
