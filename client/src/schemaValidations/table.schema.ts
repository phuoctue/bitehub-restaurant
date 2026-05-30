import { TableStatusValues } from '@/constants/type'
import z from 'zod'

export const CreateTableBody = z.object({
  number: z.coerce.number().positive(),
  capacity: z.coerce.number().positive(),
  status: z.enum(TableStatusValues).optional()
})

export type CreateTableBodyType = z.TypeOf<typeof CreateTableBody>

export const TableSchema = z.object({
  number: z.coerce.number(),
  capacity: z.coerce.number(),
  status: z.enum(TableStatusValues),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const TableRes = z.object({
  data: TableSchema,
  message: z.string()
})

export type TableResType = z.TypeOf<typeof TableRes>

export const TableListRes = z.object({
  data: z.array(TableSchema),
  message: z.string()
})

export type TableListResType = z.TypeOf<typeof TableListRes>

const ImportTableFailure = z.object({
  rowNumber: z.number(),
  message: z.string()
})

export const ImportTableSummary = z.object({
  totalRows: z.number(),
  successRows: z.number(),
  failedRows: z.number(),
  failures: z.array(ImportTableFailure)
})

export type ImportTableSummaryType = z.TypeOf<typeof ImportTableSummary>

export const ImportTableRes = z.object({
  data: ImportTableSummary,
  message: z.string()
})

export type ImportTableResType = z.TypeOf<typeof ImportTableRes>

export const UpdateTableBody = z.object({
  changeToken: z.boolean(),
  capacity: z.coerce.number().positive(),
  status: z.enum(TableStatusValues).optional()
})
export type UpdateTableBodyType = z.TypeOf<typeof UpdateTableBody>
export const TableParams = z.object({
  number: z.coerce.number()
})
export type TableParamsType = z.TypeOf<typeof TableParams>
