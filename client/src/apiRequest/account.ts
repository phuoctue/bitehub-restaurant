import http from '@/lib/http'

import {
  AccountListResType,
  AccountResType,
  ChangePasswordBodyType,
  CreateEmployeeAccountBodyType,
  CreateGuestBodyType,
  UpdateEmployeeAccountBodyType,
  UpdateMeBodyType
} from '@/schemaValidations/account.schema'
import { get } from 'http'
import { de } from 'zod/v4/locales'

const prefix = '/accounts'

const accountApiRequest = {
  me: () => http.get<AccountResType>(`${prefix}/me`),

  sMe: (accessToken: string) =>
    http.get<AccountResType>(`${prefix}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }),

  updateMe: (body: UpdateMeBodyType) =>
    http.put<AccountResType>(`${prefix}/me`, body),

  changePassword: (body: ChangePasswordBodyType) =>
    http.put<AccountResType>(`${prefix}/change-password`, body),

  list: () => http.get<AccountListResType>(`${prefix}`),

  addEmployee: (body: CreateEmployeeAccountBodyType) =>
    http.post<AccountResType>(`${prefix}`, body),
  updateEmployee: (id: number, body: UpdateEmployeeAccountBodyType) => http.put<AccountResType>(`${prefix}/detail/${id}`, body),
  getEmployee: (id: number) => http.get<AccountResType>(`${prefix}/detail/${id}`),
  deleteEmployee: (id: number) => http.delete<AccountResType>(`${prefix}/detail/${id}`),
}

export default accountApiRequest