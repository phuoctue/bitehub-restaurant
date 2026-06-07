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

type SocketTimingMeta = {
  clientSentAt?: number
  serverReceivedAt: number
  serverEmittedAt: number
}

const readClientSentAt = (headers: Record<string, unknown>) => {
  const rawHeader = headers['x-client-sent-at']
  const rawValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : undefined
}

const buildSocketTimingMeta = ({
  headers,
  receivedAt,
}: {
  headers: Record<string, unknown>
  receivedAt: number
}): SocketTimingMeta => {
  const clientSentAt = readClientSentAt(headers)
  const serverEmittedAt = Date.now()

  if (clientSentAt !== undefined) {
    console.groupCollapsed(`[realtime][guest/orders] timing`)
    console.table([
      {
        metric: 'clientSentAt',
        value: clientSentAt,
        human: new Date(clientSentAt).toLocaleTimeString(),
      },
      {
        metric: 'serverReceivedAt',
        value: receivedAt,
        human: new Date(receivedAt).toLocaleTimeString(),
      },
      {
        metric: 'serverEmittedAt',
        value: serverEmittedAt,
        human: new Date(serverEmittedAt).toLocaleTimeString(),
      },
      {
        metric: 'client -> server delta',
        value: `${receivedAt - clientSentAt} ms`,
      },
      {
        metric: 'server processing + emit delta',
        value: `${serverEmittedAt - receivedAt} ms`,
      },
      {
        metric: 'end-to-end delta so far',
        value: `${serverEmittedAt - clientSentAt} ms`,
      },
    ])
    console.groupEnd()
  }

  return {
    clientSentAt,
    serverReceivedAt: receivedAt,
    serverEmittedAt,
  }
}

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
      fastify.io.to(ManagerRoom).emit('table-update')
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
      fastify.io.to(ManagerRoom).emit('table-update')
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
      const serverReceivedAt = Date.now()
      const result = await guestCreateOrdersController(guestId, request.body)
      const newOrderTiming = buildSocketTimingMeta({
        headers: request.headers as Record<string, unknown>,
        receivedAt: serverReceivedAt,
      })
      fastify.io.to(ManagerRoom).emit('new-order', result, newOrderTiming)
      fastify.io.to(ManagerRoom).emit('table-update', undefined, newOrderTiming)
      reply.send({
        message: 'Đặt món thành công',
        data: result.map((order: any) => localizeOrder(order, locale))
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
        data: result.map((order: any) => localizeOrder(order, locale)) as GuestGetOrdersResType['data']
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
