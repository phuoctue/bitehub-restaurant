import envConfig from '@/config'
import {
  loginController,
  loginGoogleController,
  logoutController,
  refreshTokenController
} from '@/controllers/auth.controller'
import { requireLoginedHook } from '@/hooks/auth.hooks'
import {
  LoginBody,
  LoginBodyType,
  LoginGoogleQuery,
  LoginRes,
  LoginResType,
  LogoutBody,
  LogoutBodyType,
  RefreshTokenBody,
  RefreshTokenBodyType,
  RefreshTokenRes,
  RefreshTokenResType
} from '@/schemaValidations/auth.schema'
import { MessageRes, MessageResType } from '@/schemaValidations/common.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import queryString from 'query-string'

export default async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post<{ Reply: MessageResType; Body: LogoutBodyType }>(
    '/logout',
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
      const message = await logoutController(request.body.refreshToken)
      reply.send({
        message
      })
    }
  )
  fastify.post<{ Reply: LoginResType; Body: LoginBodyType }>(
    '/login',
    {
      schema: {
        response: {
          200: LoginRes
        },
        body: LoginBody
      }
    },
    async (request, reply) => {
      const { body } = request
      const { accessToken, refreshToken, account } = await loginController(body)
      reply.send({
        message: 'Đăng nhập thành công',
        data: {
          account: account as LoginResType['data']['account'],
          accessToken,
          refreshToken
        }
      })
    }
  )

  fastify.get(
    '/login/google',
    {
      schema: {
        querystring: LoginGoogleQuery
      }
    },
    async (request, reply) => {
      const { code } = request.query as { code: string }
      try {
        const { accessToken, refreshToken } = await loginGoogleController(code)
        const qs = queryString.stringify({
          accessToken,
          refreshToken,
          status: 200
        })
        return reply.redirect(`${envConfig.GOOGLE_REDIRECT_CLIENT_URL}?${qs}`)
      } catch (error: any) {
        const qs = queryString.stringify({
          message: error.message || 'Lỗi đăng nhập Google',
          status: 500
        })
        return reply.redirect(`${envConfig.GOOGLE_REDIRECT_CLIENT_URL}?${qs}`)
      }
    }
  )

  fastify.post<{
    Reply: RefreshTokenResType
    Body: RefreshTokenBodyType
  }>(
    '/refresh-token',
    {
      schema: {
        response: {
          200: RefreshTokenRes
        },
        body: RefreshTokenBody
      }
    },
    async (request, reply) => {
      const result = await refreshTokenController(request.body.refreshToken)
      reply.send({
        message: 'Lấy token mới thành công',
        data: result
      })
    }
  )
}
