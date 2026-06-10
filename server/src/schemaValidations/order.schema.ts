import { DishStatusValues, OrderStatusValues } from '@/constants/type'
import { AccountSchema } from '@/schemaValidations/account.schema'
import { TableSchema } from '@/schemaValidations/table.schema'
import z from 'zod'

const DishSnapshotSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  image: z.string(),
  description: z.string(),
  status: z.enum(DishStatusValues),
  dishId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export const OrderSchema = z.object({
  id: z.number(),
  guestId: z.number().nullable(),
  guest: z
    .object({
      id: z.number(),
      name: z.string(),
      tableNumber: z.number().nullable(),
      createdAt: z.date(),
      updatedAt: z.date()
    })
    .nullable(),
  tableNumber: z.number().nullable(),
  dishSnapshotId: z.number(),
  dishSnapshot: DishSnapshotSchema,
  quantity: z.number(),
  orderHandlerId: z.number().nullable(),
  orderHandler: AccountSchema.nullable(),
  status: z.enum(OrderStatusValues),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const UpdateOrderBody = z.object({
  status: z.enum(OrderStatusValues),
  dishId: z.number(),
  quantity: z.number()
})

export type UpdateOrderBodyType = z.TypeOf<typeof UpdateOrderBody>

export const OrderParam = z.object({
  orderId: z.coerce.number()
})

export type OrderParamType = z.TypeOf<typeof OrderParam>

export const UpdateOrderRes = z.object({
  message: z.string(),
  data: OrderSchema
})

export type UpdateOrderResType = z.TypeOf<typeof UpdateOrderRes>

export const GetOrdersQueryParams = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
})

export type GetOrdersQueryParamsType = z.TypeOf<typeof GetOrdersQueryParams>

export const GetOrdersRes = z.object({
  message: z.string(),
  data: z.array(OrderSchema)
})

export type GetOrdersResType = z.TypeOf<typeof GetOrdersRes>

export const GetOrderDetailRes = z.object({
  message: z.string(),
  data: OrderSchema.extend({
    table: TableSchema
  })
})

export type GetOrderDetailResType = z.TypeOf<typeof GetOrderDetailRes>

export const PayGuestOrdersBody = z.object({
  guestId: z.number()
})

export type PayGuestOrdersBodyType = z.TypeOf<typeof PayGuestOrdersBody>

export const InvoicePaymentQrSchema = z.object({
  bankId: z.string(),
  accountNo: z.string(),
  accountName: z.string(),
  template: z.string().optional(),
  transferPrefix: z.string().optional(),
  amount: z.number(),
  transferContent: z.string(),
  imageUrl: z.string()
})

export type InvoicePaymentQrSchemaType = z.TypeOf<typeof InvoicePaymentQrSchema>

export const InvoiceSchema = z.object({
  invoiceNumber: z.string(),
  invoiceUrl: z.string(),
  paymentQr: InvoicePaymentQrSchema.nullable().optional()
})

export type InvoiceSchemaType = z.TypeOf<typeof InvoiceSchema>

export const GetOrderInvoiceRes = z.object({
  message: z.string(),
  data: InvoiceSchema
})

export type GetOrderInvoiceResType = z.TypeOf<typeof GetOrderInvoiceRes>

export const PayGuestOrdersRes = z.object({
  message: z.string(),
  data: z.array(OrderSchema),
  invoice: InvoiceSchema.nullable().optional()
})

export type PayGuestOrdersResType = z.TypeOf<typeof PayGuestOrdersRes>

export const CreateOrdersBody = z
  .object({
    guestId: z.number(),
    orders: z.array(
      z.object({
        dishId: z.number(),
        quantity: z.number()
      })
    )
  })
  .strict()

export type CreateOrdersBodyType = z.TypeOf<typeof CreateOrdersBody>

export const CreateOrdersRes = z.object({
  message: z.string(),
  data: z.array(OrderSchema)
})

export type CreateOrdersResType = z.TypeOf<typeof CreateOrdersRes>
