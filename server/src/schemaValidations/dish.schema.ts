import { DishStatusValues } from '@/constants/type'
import z from 'zod'

export const CreateDishBody = z.object({
  name: z.string().min(1).max(256),
  price: z.coerce.number().positive(),
  description: z.string().max(10000),
  image: z.string().url(),
  status: z.enum(DishStatusValues).optional()
})

export type CreateDishBodyType = z.TypeOf<typeof CreateDishBody>

export const DishSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.coerce.number(),
  description: z.string(),
  image: z.string(),
  status: z.enum(DishStatusValues),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const DishRes = z.object({
  data: DishSchema,
  message: z.string()
})

export type DishResType = z.TypeOf<typeof DishRes>

export const DishListRes = z.object({
  data: z.array(DishSchema),
  message: z.string()
})

export type DishListResType = z.TypeOf<typeof DishListRes>

const ImportDishFailure = z.object({
  rowNumber: z.number(),
  message: z.string()
})

export const ImportDishSummary = z.object({
  totalRows: z.number(),
  successRows: z.number(),
  failedRows: z.number(),
  failures: z.array(ImportDishFailure)
})

export type ImportDishSummaryType = z.TypeOf<typeof ImportDishSummary>

export const ImportDishRes = z.object({
  data: ImportDishSummary,
  message: z.string()
})

export type ImportDishResType = z.TypeOf<typeof ImportDishRes>

export const UpdateDishBody = CreateDishBody
export type UpdateDishBodyType = CreateDishBodyType
export const DishParams = z.object({
  id: z.coerce.number()
})
export type DishParamsType = z.TypeOf<typeof DishParams>
