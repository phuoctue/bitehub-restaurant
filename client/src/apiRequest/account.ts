import http from "@/lib/http";
import {
  AccountResType,
  ChangePasswordBodyType,
  UpdateMeBodyType,
} from "@/schemaValidations/account.schema";

const accountApiRequest = {
  me: () => http.get<AccountResType>("/accounts/me"),
  updatMe: (body: UpdateMeBodyType) =>
    http.put<AccountResType>("/accounts/me", body),
  changPassword: (body: ChangePasswordBodyType) =>
    http.put<AccountResType>("/accounts/change-password", body),
};

export default accountApiRequest;
