import fs from 'fs'
import path from 'path'
import z from 'zod'
import { config } from 'dotenv'

config({
  path: '.env'
})


const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  GUEST_ACCESS_TOKEN_EXPIRES_IN: z.string(),
  GUEST_REFRESH_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  INITIAL_EMAIL_OWNER: z.string(),
  INITIAL_PASSWORD_OWNER: z.string(),
  DOMAIN: z.string(),
  PROTOCOL: z.string(),
  PUBLIC_API_URL: z.string().url().optional(),
  UPLOAD_FOLDER: z.string(),
  CLIENT_ORIGIN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_CLIENT_URL: z.string(),
  GOOGLE_AUTHORIZED_REDIRECT_URI: z.string().url().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional()
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.error(configServer.error.issues)
  throw new Error('Các giá trị khai báo trong file .env không hợp lệ')
}
const envConfig = configServer.data
const normalizedPublicApiUrl = envConfig.PUBLIC_API_URL?.replace(/\/$/, '')
const localDomains = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const portSegment = localDomains.has(envConfig.DOMAIN) ? `:${envConfig.PORT}` : ''
export const API_URL = normalizedPublicApiUrl ?? `${envConfig.PROTOCOL}://${envConfig.DOMAIN}${portSegment}`
export const GOOGLE_REDIRECT_URI =
  envConfig.GOOGLE_REDIRECT_URI || envConfig.GOOGLE_AUTHORIZED_REDIRECT_URI || `${API_URL}/auth/login/google`
export default envConfig

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof configSchema> {}
  }
}
