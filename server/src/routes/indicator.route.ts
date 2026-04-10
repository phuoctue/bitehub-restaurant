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
        data
      })
    }
  )
}
