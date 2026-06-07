import { ManagerRoom } from '@/constants/type'
import {
  createOrdersController,
  getOrderInvoiceController,
  getOrderDetailController,
  getOrdersController,
  payOrdersController,
  updateOrderController,
  deleteOrderController
} from '@/controllers/order.controller'
import { requireLoginedHook, requireStaffHook } from '@/hooks/auth.hooks'
import {
  CreateOrdersBody,
  CreateOrdersBodyType,
  CreateOrdersRes,
  CreateOrdersResType,
  GetOrderDetailRes,
  GetOrderDetailResType,
  GetOrderInvoiceRes,
  GetOrderInvoiceResType,
  GetOrdersQueryParams,
  GetOrdersQueryParamsType,
  GetOrdersRes,
  GetOrdersResType,
  OrderParam,
  OrderParamType,
  PayGuestOrdersBody,
  PayGuestOrdersBodyType,
  PayGuestOrdersRes,
  PayGuestOrdersResType,
  UpdateOrderBody,
  UpdateOrderBodyType,
  UpdateOrderRes,
  UpdateOrderResType
} from '@/schemaValidations/order.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { InvoiceLocale } from '@/utils/invoice'

const resolveInvoiceLocale = (headers: Record<string, any>): InvoiceLocale => {
  const explicitLocale = String(headers['x-locale'] || '').toLowerCase()
  if (explicitLocale.startsWith('en')) return 'en'
  if (explicitLocale.startsWith('vi')) return 'vi'

  const acceptLanguage = String(headers['accept-language'] || '').toLowerCase()
  if (acceptLanguage.includes('en')) return 'en'
  return 'vi'
}

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
  eventName
}: {
  headers: Record<string, unknown>
  receivedAt: number
  eventName: string
}): SocketTimingMeta => {
  const clientSentAt = readClientSentAt(headers)
  const serverEmittedAt = Date.now()

  if (clientSentAt !== undefined) {
    console.groupCollapsed(`[realtime][${eventName}] timing`)
    console.table([
      {
        metric: 'clientSentAt',
        value: clientSentAt,
        human: new Date(clientSentAt).toLocaleTimeString()
      },
      {
        metric: 'serverReceivedAt',
        value: receivedAt,
        human: new Date(receivedAt).toLocaleTimeString()
      },
      {
        metric: 'serverEmittedAt',
        value: serverEmittedAt,
        human: new Date(serverEmittedAt).toLocaleTimeString()
      },
      {
        metric: 'client -> server delta',
        value: `${receivedAt - clientSentAt} ms`
      },
      {
        metric: 'server processing + emit delta',
        value: `${serverEmittedAt - receivedAt} ms`
      },
      {
        metric: 'end-to-end delta so far',
        value: `${serverEmittedAt - clientSentAt} ms`
      }
    ])
    console.groupEnd()
  }

  return {
    clientSentAt,
    serverReceivedAt: receivedAt,
    serverEmittedAt
  }
}

export default async function orderRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.addHook('preValidation', fastify.auth([requireLoginedHook]))
  fastify.post<{ Reply: CreateOrdersResType; Body: CreateOrdersBodyType }>(
    '/',
    {
      schema: {
        response: {
          200: CreateOrdersRes
        },
        body: CreateOrdersBody
      },
      preValidation: fastify.auth([requireLoginedHook, requireStaffHook])
    },
    async (request, reply) => {
      const serverReceivedAt = Date.now()
      const { socketId, orders } = await createOrdersController(
        request.decodedAccessToken?.userId as number,
        request.body
      )
      const newOrderTiming = buildSocketTimingMeta({
        headers: request.headers as Record<string, unknown>,
        receivedAt: serverReceivedAt,
        eventName: 'new-order'
      })
      if (socketId) {
        fastify.io.to(ManagerRoom).to(socketId).emit('new-order', orders, newOrderTiming)
      } else {
        fastify.io.to(ManagerRoom).emit('new-order', orders, newOrderTiming)
      }
      fastify.io.to(ManagerRoom).emit('table-update', undefined, newOrderTiming)
      reply.send({
        message: `Tạo thành công ${orders.length} đơn hàng cho khách hàng`,
        data: orders as CreateOrdersResType['data']
      })
    }
  )
  fastify.get<{ Reply: GetOrdersResType; Querystring: GetOrdersQueryParamsType }>(
    '/',
    {
      schema: {
        response: {
          200: GetOrdersRes
        },
        querystring: GetOrdersQueryParams
      },
      preValidation: fastify.auth([requireLoginedHook, requireStaffHook])
    },
    async (request, reply) => {
      const result = await getOrdersController({
        fromDate: request.query.fromDate,
        toDate: request.query.toDate
      })
      reply.send({
        message: 'Lấy danh sách đơn hàng thành công',
        data: result as GetOrdersResType['data']
      })
    }
  )

  fastify.get<{ Reply: GetOrderInvoiceResType; Params: OrderParamType }>(
    '/:orderId/invoice',
    {
      schema: {
        response: {
          200: GetOrderInvoiceRes
        },
        params: OrderParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireStaffHook])
    },
    async (request, reply) => {
      const locale = resolveInvoiceLocale(request.headers as Record<string, any>)
      const result = await getOrderInvoiceController(request.params.orderId, locale)
      reply.send({
        message: 'Tạo hóa đơn thành công',
        data: result as GetOrderInvoiceResType['data']
      })
    }
  )

  fastify.get<{ Reply: GetOrderDetailResType; Params: OrderParamType }>(
    '/:orderId',
    {
      schema: {
        response: {
          200: GetOrderDetailRes
        },
        params: OrderParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireStaffHook])
    },
    async (request, reply) => {
      const result = await getOrderDetailController(request.params.orderId)
      reply.send({
        message: 'Lấy đơn hàng thành công',
        data: result as GetOrderDetailResType['data']
      })
    }
  )

  fastify.put<{ Reply: UpdateOrderResType; Body: UpdateOrderBodyType; Params: OrderParamType }>(
    '/:orderId',
    {
      schema: {
        response: {
          200: UpdateOrderRes
        },
        body: UpdateOrderBody,
        params: OrderParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireStaffHook])
    },
    async (request, reply) => {
      const serverReceivedAt = Date.now()
      const result = await updateOrderController(request.params.orderId, {
        ...request.body,
        orderHandlerId: request.decodedAccessToken?.userId as number
      })
      const updateOrderTiming = buildSocketTimingMeta({
        headers: request.headers as Record<string, unknown>,
        receivedAt: serverReceivedAt,
        eventName: 'update-order'
      })
      if (result.socketId) {
        fastify.io.to(result.socketId).to(ManagerRoom).emit('update-order', result.order, updateOrderTiming)
      } else {
        fastify.io.to(ManagerRoom).emit('update-order', result.order, updateOrderTiming)
      }
      fastify.io.to(ManagerRoom).emit('table-update', undefined, updateOrderTiming)
      reply.send({
        message: 'Cập nhật đơn hàng thành công',
        data: result.order as UpdateOrderResType['data']
      })
    }
  )

  fastify.delete<{ Reply: UpdateOrderResType; Params: OrderParamType }>(
    '/:orderId',
    {
      schema: {
        response: {
          200: UpdateOrderRes
        },
        params: OrderParam
      },
      preValidation: fastify.auth([requireLoginedHook, requireStaffHook])
    },
    async (request, reply) => {
      const serverReceivedAt = Date.now()
      const result = await deleteOrderController(request.params.orderId)
      const deleteOrderTiming = buildSocketTimingMeta({
        headers: request.headers as Record<string, unknown>,
        receivedAt: serverReceivedAt,
        eventName: 'delete-order'
      })
      if (result.socketId) {
        fastify.io.to(result.socketId).to(ManagerRoom).emit('delete-order', result.order, deleteOrderTiming)
      } else {
        fastify.io.to(ManagerRoom).emit('delete-order', result.order, deleteOrderTiming)
      }
      fastify.io.to(ManagerRoom).emit('table-update', undefined, deleteOrderTiming)
      reply.send({
        message: 'Xóa đơn hàng thành công',
        data: result.order as UpdateOrderResType['data']
      })
    }
  )

  fastify.post<{ Body: PayGuestOrdersBodyType; Reply: PayGuestOrdersResType }>(
    '/pay',
    {
      schema: {
        response: {
          200: PayGuestOrdersRes
        },
        body: PayGuestOrdersBody
      },
      preValidation: fastify.auth([requireLoginedHook, requireStaffHook])
    },
    async (request, reply) => {
      const locale = resolveInvoiceLocale(request.headers as Record<string, any>)
      const serverReceivedAt = Date.now()
      const result = await payOrdersController({
        guestId: request.body.guestId,
        orderHandlerId: request.decodedAccessToken?.userId as number,
        locale
      })
      const paymentTiming = buildSocketTimingMeta({
        headers: request.headers as Record<string, unknown>,
        receivedAt: serverReceivedAt,
        eventName: 'payment'
      })
      if (result.socketId) {
        fastify.io.to(result.socketId).to(ManagerRoom).emit('payment', result.orders, paymentTiming)
      } else {
        fastify.io.to(ManagerRoom).emit('payment', result.orders, paymentTiming)
      }
      fastify.io.to(ManagerRoom).emit('table-update', undefined, paymentTiming)
      reply.send({
        message: `Thanh toán thành công ${result.orders.length} đơn`,
        data: result.orders as PayGuestOrdersResType['data'],
        invoice: result.invoice || null
      })
    }
  )
}
