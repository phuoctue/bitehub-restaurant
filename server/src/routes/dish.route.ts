import { createDish, deleteDish, getDishDetail, getDishList, importDishesFromExcel, updateDish } from '@/controllers/dish.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import {
  CreateDishBody,
  CreateDishBodyType,
  DishListRes,
  DishListResType,
  DishParams,
  DishParamsType,
  DishRes,
  DishResType,
  ImportDishRes,
  ImportDishResType,
  UpdateDishBody,
  UpdateDishBodyType
} from '@/schemaValidations/dish.schema'
import { assertExcelHeaders, readExcelHeaders } from '@/utils/excel-import'
import { pickLocalizedText, resolveContentLocale } from '@/utils/locale'
import fastifyMultipart from '@fastify/multipart'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

const localizeDish = (dish: any, locale: 'vi' | 'en') => {
  return {
    ...dish,
    name: pickLocalizedText({ locale, vi: dish.name, en: dish.nameEn }),
    description: pickLocalizedText({ locale, vi: dish.description, en: dish.descriptionEn })
  }
}

export default async function dishRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(fastifyMultipart)

  fastify.get<{
    Reply: DishListResType
  }>(
    '/',
    {
      schema: {
        response: {
          200: DishListRes
        }
      }
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const dishs = await getDishList()
      reply.send({
        data: dishs.map((dish: any) => localizeDish(dish, locale)) as DishListResType['data'],
        message: 'Lấy danh sách món ăn thành công!'
      })
    }
  )

  fastify.get<{
    Params: DishParamsType
    Reply: DishResType
  }>(
    '/:id',
    {
      schema: {
        params: DishParams,
        response: {
          200: DishRes
        }
      }
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const dish = await getDishDetail(request.params.id)
      reply.send({
        data: localizeDish(dish, locale) as DishResType['data'],
        message: 'Lấy thông tin món ăn thành công!'
      })
    }
  )

  fastify.post<{
    Body: CreateDishBodyType
    Reply: DishResType
  }>(
    '',
    {
      schema: {
        body: CreateDishBody,
        response: {
          200: DishRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const dish = await createDish(request.body)
      reply.send({
        data: localizeDish(dish, locale) as DishResType['data'],
        message: 'Tạo món ăn thành công!'
      })
    }
  )

  fastify.post<{
    Reply: ImportDishResType
  }>(
    '/import',
    {
      schema: {
        response: {
          200: ImportDishRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const file = await request.file({
        limits: {
          fileSize: 1024 * 1024 * 10,
          fields: 1,
          files: 1
        }
      })

      if (!file) {
        throw new Error('Không tìm thấy file Excel')
      }

      const filename = file.filename.toLowerCase()
      if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
        throw new Error('Vui lòng chọn file Excel hợp lệ')
      }

      const buffer = await file.toBuffer()
      assertExcelHeaders(
        readExcelHeaders(buffer),
        [
          ['name', 'dishname', 'tenmonan', 'tên món ăn'],
          ['price', 'pricevnd', 'gia', 'giá'],
          ['description', 'mota', 'mô tả'],
          ['image', 'anh'],
          ['status', 'trangthai', 'trạng thái']
        ],
        'File món ăn'
      )
      const summary = await importDishesFromExcel(buffer)

      reply.send({
        data: summary,
        message: `Đã nhập ${summary.successRows}/${summary.totalRows} món ăn, ${summary.failedRows} dòng lỗi`
      })
    }
  )

  fastify.put<{
    Params: DishParamsType
    Body: UpdateDishBodyType
    Reply: DishResType
  }>(
    '/:id',
    {
      schema: {
        params: DishParams,
        body: UpdateDishBody,
        response: {
          200: DishRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const dish = await updateDish(request.params.id, request.body)
      reply.send({
        data: localizeDish(dish, locale) as DishResType['data'],
        message: 'Cập nhật món ăn thành công!'
      })
    }
  )

  fastify.delete<{
    Params: DishParamsType
    Reply: DishResType
  }>(
    '/:id',
    {
      schema: {
        params: DishParams,
        response: {
          200: DishRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const locale = resolveContentLocale(request.headers as Record<string, unknown>)
      const result = await deleteDish(request.params.id)
      reply.send({
        message: 'Xóa món ăn thành công!',
        data: localizeDish(result, locale) as DishResType['data']
      })
    }
  )
}
