import envConfig, { GOOGLE_REDIRECT_URI } from '@/config'
import prisma from '@/database'
import { LoginBodyType } from '@/schemaValidations/auth.schema'
import { RoleType, TokenPayload } from '@/types/jwt.types'
import { comparePassword } from '@/utils/crypto'
import { AuthError, EntityError, StatusError } from '@/utils/errors'
import axios from 'axios'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt'

export const logoutController = async (refreshToken: string) => {
  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  })
  return 'Đăng xuất thành công'
}

export const loginController = async (body: LoginBodyType) => {
  const account = await prisma.account.findUnique({
    where: {
      email: body.email
    }
  })
  if (!account) {
    throw new EntityError([{ field: 'email', message: 'Email không tồn tại' }])
  }
  const isPasswordMatch = await comparePassword(body.password, account.password)
  if (!isPasswordMatch) {
    throw new EntityError([{ field: 'password', message: 'Email hoặc mật khẩu không đúng' }])
  }
  const accessToken = signAccessToken({
    userId: account.id,
    role: account.role as RoleType
  })
  const refreshToken = signRefreshToken({
    userId: account.id,
    role: account.role as RoleType
  })
  const decodedRefreshToken = verifyRefreshToken(refreshToken)
  const refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000)

  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt
    }
  })
  return {
    account,
    accessToken,
    refreshToken
  }
}

export const loginGoogleController = async (code: string) => {
  // 1. Đổi code lấy id_token từ Google API
  let response
  try {
    response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: envConfig.GOOGLE_CLIENT_ID,
      client_secret: envConfig.GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const googleError = error.response?.data as { error?: string; error_description?: string } | undefined
      const description = googleError?.error_description || googleError?.error || error.message
      throw new Error(`Google OAuth failed: ${description}`)
    }
    throw error
  }

  const { id_token } = response.data

  // 2. Lấy thông tin user từ id_token (decode không cần verify vì lấy trực tiếp từ Google)
  const googleUser = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString())

  // 3. Chi cho phep Gmail da duoc admin tao san trong DB
  const account = await prisma.account.findFirst({
    where: {
      email: {
        equals: googleUser.email,
        mode: 'insensitive'
      }
    }
  })

  if (!account) {
    throw new StatusError({
      message: 'Gmail không phải nhân viên quán',
      status: 403
    })
  }

  // 4. Tạo bộ Token hệ thống
  const accessToken = signAccessToken({
    userId: account.id,
    role: account.role as RoleType
  })
  const refreshToken = signRefreshToken({
    userId: account.id,
    role: account.role as RoleType
  })

  const decodedRefreshToken = verifyRefreshToken(refreshToken)
  const refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000)

  // 5. Lưu Refresh Token vào DB
  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt
    }
  })

  return { accessToken, refreshToken }
}

export const refreshTokenController = async (refreshToken: string) => {
  let decodedRefreshToken: TokenPayload
  try {
    decodedRefreshToken = verifyRefreshToken(refreshToken)
  } catch (error) {
    throw new AuthError('Refresh token không hợp lệ')
  }
  const refreshTokenDoc = await prisma.refreshToken.findUniqueOrThrow({
    where: {
      token: refreshToken
    },
    include: {
      account: true
    }
  })
  const account = refreshTokenDoc.account
  const newAccessToken = signAccessToken({
    userId: account.id,
    role: account.role as RoleType
  })
  const newRefreshToken = signRefreshToken({
    userId: account.id,
    role: account.role as RoleType,
    exp: decodedRefreshToken.exp
  })
  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  })
  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      token: newRefreshToken,
      expiresAt: refreshTokenDoc.expiresAt
    }
  })
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  }
}

