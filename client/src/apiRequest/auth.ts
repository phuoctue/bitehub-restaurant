import http from "@/lib/http";
import { LoginBodyType, LoginResType } from "@/schemaValidations/auth.schema";

const authApiRequest = {
  sLogin: (body: LoginBodyType) => http.post<LoginResType>("/auth/login", body),
  login: (body: LoginBodyType) =>
    http.post<LoginResType>("/api/auth/login", body, {
      baseUrl: "",
    }),
  sLogout: () => http.post("/auth/logout", {}),
  logout: () =>
    http.post("/api/auth/logout", null, {
      baseUrl: "",
    }),
};

export default authApiRequest;
