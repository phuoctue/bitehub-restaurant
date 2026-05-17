import { createTable, deleteTable, getTableDetail, getTableList, importTablesFromExcel, updateTable } from '@/controllers/table.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import {
  CreateTableBody,
  CreateTableBodyType,
  TableListRes,
  TableListResType,
  TableParams,
  TableParamsType,
  TableRes,
  TableResType,
  ImportTableRes,
  ImportTableResType,
  UpdateTableBody,
  UpdateTableBodyType
} from '@/schemaValidations/table.schema'
import { assertExcelHeaders, readExcelHeaders } from '@/utils/excel-import'
import fastifyMultipart from '@fastify/multipart'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function tablesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(fastifyMultipart)

  fastify.get<{
    Reply: TableListResType
  }>(
    '/',
    {
      schema: {
        response: {
          200: TableListRes
        }
      }
    },
    async (request, reply) => {
      const Tables = await getTableList()
      reply.send({
        data: Tables as TableListResType['data'],
        message: 'Lấy danh sách bàn thành công!'
      })
    }
  )

  fastify.get<{
    Params: TableParamsType
    Reply: TableResType
  }>(
    '/:number',
    {
      schema: {
        params: TableParams,
        response: {
          200: TableRes
        }
      }
    },
    async (request, reply) => {
      const Table = await getTableDetail(request.params.number)
      reply.send({
        data: Table as TableResType['data'],
        message: 'Lấy thông tin bàn thành công!'
      })
    }
  )

  fastify.post<{
    Body: CreateTableBodyType
    Reply: TableResType
  }>(
    '',
    {
      schema: {
        body: CreateTableBody,
        response: {
          200: TableRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const Table = await createTable(request.body)
      reply.send({
        data: Table as TableResType['data'],
        message: 'Tạo bàn thành công!'
      })
    }
  )

    fastify.post<{
      Reply: ImportTableResType
    }>(
      '/import',
      {
        schema: {
          response: {
            200: ImportTableRes
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
        assertExcelHeaders(readExcelHeaders(buffer), [
          ['number', 'table', 'table number', 'số hiệu bàn'],
          ['capacity', 'allowed capacity', 'lượng khách cho phép'],
          ['status', 'trangthai', 'trạng thái']
        ], 'File bàn')
        const summary = await importTablesFromExcel(buffer)

        reply.send({
          data: summary,
          message: `Đã nhập ${summary.successRows}/${summary.totalRows} bàn, ${summary.failedRows} dòng lỗi`
        })
      }
    )

  fastify.put<{
    Params: TableParamsType
    Body: UpdateTableBodyType
    Reply: TableResType
  }>(
    '/:number',
    {
      schema: {
        params: TableParams,
        body: UpdateTableBody,
        response: {
          200: TableRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const Table = await updateTable(request.params.number, request.body)
      reply.send({
        data: Table as TableResType['data'],
        message: 'Cập nhật bàn thành công!'
      })
    }
  )

  fastify.delete<{
    Params: TableParamsType
    Reply: TableResType
  }>(
    '/:number',
    {
      schema: {
        params: TableParams,
        response: {
          200: TableRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const result = await deleteTable(request.params.number)
      reply.send({
        message: 'Xóa bàn thành công!',
        data: result as TableResType['data']
      })
    }
  )
}
