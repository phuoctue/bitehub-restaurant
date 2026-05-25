import { RoleValues } from '@/constants/type'
import { OrderSchema } from '@/schemaValidations/order.schema'
import z from 'zod'

export const GuestLoginBody = z
  .object({
    name: z.string().min(2).max(50),
    tableNumber: z.number(),
    token: z.string()
  })
  .strict()

export type GuestLoginBodyType = z.TypeOf<typeof GuestLoginBody>

export const GuestLoginRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    guest: z.object({
      id: z.number(),
      name: z.string(),
      role: z.enum(RoleValues),
      tableNumber: z.number().nullable(),
      createdAt: z.date(),
      updatedAt: z.date()
    })
  }),
  message: z.string()
})

export type GuestLoginResType = z.TypeOf<typeof GuestLoginRes>

export const GuestCreateOrdersBody = z.array(
  z.object({
    dishId: z.number(),
    quantity: z.number()
  })
)

export type GuestCreateOrdersBodyType = z.TypeOf<typeof GuestCreateOrdersBody>

export const GuestCreateOrdersRes = z.object({
  message: z.string(),
  data: z.array(OrderSchema)
})

export type GuestCreateOrdersResType = z.TypeOf<typeof GuestCreateOrdersRes>

export const GuestGetOrdersRes = GuestCreateOrdersRes

export type GuestGetOrdersResType = z.TypeOf<typeof GuestGetOrdersRes>

export const GuestRecommendationsQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(12).optional().default(8)
  })
  .strict()

export type GuestRecommendationsQueryType = z.TypeOf<typeof GuestRecommendationsQuery>

export const RecommendationDishSchema = z.object({
  dishId: z.number(),
  name: z.string(),
  price: z.number(),
  image: z.string(),
  score: z.number(),
  reasons: z.array(z.string())
})

export const GuestRecommendationsRes = z.object({
  message: z.string(),
  data: z.array(RecommendationDishSchema)
})

export type GuestRecommendationsResType = z.TypeOf<typeof GuestRecommendationsRes>

export const RecommendationClickParam = z.object({
  dishId: z.coerce.number().int().positive()
})

export type RecommendationClickParamType = z.TypeOf<typeof RecommendationClickParam>
