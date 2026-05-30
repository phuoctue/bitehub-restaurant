import { ManagerRoom, Role } from '@/constants/type'
import {
  guestCreateOrdersController,
  guestGetOrdersController,
  guestLoginController,
  guestLogoutController,
  guestGetRecommendationsController,
  guestRecommendationClickController,
  guestRefreshTokenController
} from '@/controllers/guest.controller'
import { requireGuestHook, requireLoginedHook } from '@/hooks/auth.hooks'
import {
  LogoutBody,
  LogoutBodyType,
  RefreshTokenBody,
  RefreshTokenBodyType,
  RefreshTokenRes,
  RefreshTokenResType
} from '@/schemaValidations/auth.schema'
import { MessageRes, MessageResType } from '@/schemaValidations/common.schema'
import {
  GuestCreateOrdersBody,
  GuestCreateOrdersBodyType,
  GuestCreateOrdersRes,
  GuestCreateOrdersResType,
  GuestGetOrdersRes,
  GuestGetOrdersResType,
  GuestRecommendationsQuery,
  GuestRecommendationsQueryType,
  GuestRecommendationsRes,
  GuestRecommendationsResType,
  GuestLoginBody,
  GuestLoginBodyType,
  GuestLoginRes,
  GuestLoginResType,
  RecommendationClickParam,
  RecommendationClickParamType
} from '@/schemaValidations/guest.schema'
import { pickLocalizedText, resolveContentLocale } from '@/utils/locale'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

const localizeOrder = (order: any, locale: 'vi' | 'en') => ({
  ...order,
  dishSnapshot: {
    ...order.dishSnapshot,
    name: pickLocalizedText({ locale, vi: order.dishSnapshot.name, en: order.dishSnapshot.nameEn }),
    description: pickLocalizedText({
      locale,
      vi: order.dishSnapshot.description,
      en: order.dishSnapshot.descriptionEn
    })
  }
})

export default async function guestRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post<{ Reply: GuestLoginResType; Body: GuestLoginBodyType }>(
    '/auth/login',
    {
      schema: {
        response: {
          200: GuestLoginRes
        },
        body: GuestLoginBody
      }
    },
    async (request, reply) => {
      const { body } = request
      const result = await guestLoginController(body)
      reply.send({
        message: 'Đăng nhập thành công',
        data: {
          guest: {
            id: result.guest.id,
            name: result.guest.name,
            role: Role.Guest,
            tableNumber: result.guest.tableNumber,
            createdAt: result.guest.createdAt,
            updatedAt: result.guest.updatedAt
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      })
    }
  )

  fastify.post<{ Reply: MessageResType; Body: LogoutBodyType }>(
    '/auth/logout',
    {
      schema: {
        response: {
          200: MessageRes
        },
        body: LogoutBody
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const message = await guestLogoutController(request.decodedAccessToken?.userId as number)
      reply.send({
        message
      })
    }
  )

  fastify.post<{
    Reply: RefreshTokenResType
    Body: RefreshTokenBodyType
  }>(
    '/auth/refresh-token',
    {
      schema: {
        response: {
          200: RefreshTokenRes
        },
        body: RefreshTokenBody
      }
    },
    async (request, reply) => {
      const result = await guestRefreshTokenController(request.body.refreshToken)
      reply.send({
        message: 'Lấy token mới thành công',
        data: result
      })
    }
  )

  fastify.post<{
    Reply: GuestCreateOrdersResType
    Body: GuestCreateOrdersBodyType
  }>(
    '/orders',
    {
      schema: {
        response: {
          200: GuestCreateOrdersRes
        },
        body: GuestCreateOrdersBody
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const guestId = request.decodedAccessToken?.userId as number
      const result = await guestCreateOrdersController(guestId, request.body)
      fastify.io.to(ManagerRoom).emit('new-order', result)
      reply.send({
        message: 'Đặt món thành công',
        data: result.map((order) => localizeOrder(order, locale))
      })
    }
  )

  fastify.get<{
    Reply: GuestGetOrdersResType
  }>(
    '/orders',
    {
      schema: {
        response: {
          200: GuestGetOrdersRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const guestId = request.decodedAccessToken?.userId as number
      const result = await guestGetOrdersController(guestId)
      reply.send({
        message: 'Lấy danh sách đơn hàng thành công',
        data: result.map((order) => localizeOrder(order, locale)) as GuestGetOrdersResType['data']
      })
    }
  )

  fastify.get<{
    Reply: GuestRecommendationsResType
    Querystring: GuestRecommendationsQueryType
  }>(
    '/recommendations',
    {
      schema: {
        response: {
          200: GuestRecommendationsRes
        },
        querystring: GuestRecommendationsQuery
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const guestId = request.decodedAccessToken?.userId as number
      const result = await guestGetRecommendationsController(guestId, request.query)
      reply.send({
        message: 'Lấy gợi ý món thành công',
        data: result.map((item) => ({
          ...item,
          name: pickLocalizedText({ locale, vi: item.name, en: item.nameEn })
        }))
      })
    }
  )

  fastify.post<{
    Reply: MessageResType
    Params: RecommendationClickParamType
  }>(
    '/recommendations/:dishId/click',
    {
      schema: {
        response: {
          200: MessageRes
        },
        params: RecommendationClickParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const guestId = request.decodedAccessToken?.userId as number
      const message = await guestRecommendationClickController(guestId, request.params.dishId)
      reply.send({ message })
    }
  )
}
