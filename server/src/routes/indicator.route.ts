import { getIndicatorsController } from '@/controllers/indicator.controller'
import {
  DashboardIndicatorQueryParams,
  DashboardIndicatorQueryParamsType,
  DashboardIndicatorRes,
  DashboardIndicatorResType
} from '@/schemaValidations/indicator.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function indicatorRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get<{ Querystring: DashboardIndicatorQueryParamsType; Reply: DashboardIndicatorResType }>(
    '/dashboard',
    {
      schema: {
        querystring: DashboardIndicatorQueryParams,
        response: {
          200: DashboardIndicatorRes
        }
      }
    },
    async (request, reply) => {
      const data = await getIndicatorsController(request.query)
      reply.send({
        message: 'Lấy dữ liệu indicators thành công',
        data: {
          ...data,
          dishIndicator: data.dishIndicator.map((dish) => ({
            ...dish,
            status: dish.status ?? 'Available',
            id: dish.id ?? 0,
            createdAt: dish.createdAt ?? new Date(),
            updatedAt: dish.updatedAt ?? new Date(),
            price: dish.price ?? 0,
            description: dish.description ?? '',
            image: dish.image ?? ''
          }))
        }
      })
    }
  )
}
