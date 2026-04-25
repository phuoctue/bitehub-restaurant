import envConfig from "@/config";
import {
  getAccessTokenFromLocalStorage,
  normalizePath,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
} from "@/lib/utils";
import { LoginResType } from "@/schemaValidations/auth.schema";
import { redirect } from "next/navigation";

type CustomOptions = Omit<RequestInit, "method" | "body"> & {
  baseUrl?: string | undefined;
  body?: unknown;
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;

type EntityErrorPayload = {
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
};

export class HttpError extends Error {
  status: number;
  payload: {
    message: string;
    [key: string]: unknown;
  };
  constructor({
    status,
    payload,
    message = "Lỗi HTTP",
  }: {
    status: number;
    payload: { message: string; [key: string]: unknown };
    message?: string;
  }) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: typeof ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;
  constructor({
    status,
    payload,
  }: {
    status: typeof ENTITY_ERROR_STATUS;
    payload: EntityErrorPayload;
  }) {
    super({ status, payload, message: "Lỗi thực thể" });
    this.status = status;
    this.payload = payload;
  }
}

let clientLogoutRequest: null | Promise<Response> = null;
const isClient = typeof window !== "undefined";
const request = async <Response>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  options?: CustomOptions | undefined,
) => {
  let body: FormData | string | undefined = undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }
  const baseHeaders: Record<string, string> =
    body instanceof FormData
      ? {}
      : {
          "Content-Type": "application/json",
        };
  if (isClient) {
    const accessToken = getAccessTokenFromLocalStorage();
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }
  // Nếu không truyền baseUrl (hoặc baseUrl = undefined) thì lấy từ envConfig.NEXT_PUBLIC_API_ENDPOINT
  // Nếu truyền baseUrl thì lấy giá trị truyền vào, truyền vào '' thì đồng nghĩa với việc chúng ta gọi API đến Next.js Server

  const baseUrl =
    options?.baseUrl === undefined
      ? envConfig.NEXT_PUBLIC_API_ENDPOINT
      : options.baseUrl;

  const fullUrl = `${baseUrl}/${normalizePath(url)}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers,
    } as Record<string, string>,
    body,
    method,
  });
  const payload: Response = await res.json();
  const data = {
    status: res.status,
    payload,
  };
  // Interceptor là nơi chúng ta xử lý request và response trước khi trả về cho phía component
  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: 422;
          payload: EntityErrorPayload;
        },
      );
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      if (isClient) {
        if (!clientLogoutRequest) {
          clientLogoutRequest = fetch("/api/auth/logout", {
            method: "POST",
            body: null, //Logout sẽ cho phép luôn luôn thành công nên không cần body
            headers: {
              ...baseHeaders,
            } as Record<string, string>,
          });
          try {
            await clientLogoutRequest;
          } catch {
          } finally {
            removeTokensFromLocalStorage();
            clientLogoutRequest = null;
            //redirect về trang login có thể dẫn đến loop vô hạn
            // Nếu không đc xử lý đúng cách
            // Vì nếu rơi vào trường hợp tại trang login, chúng ta gọi các api đến access Token
            // Mã access Token đã bị hết hạn sẽ nhảy vào đây, và cử thế sẽ bị loop
            location.href = "/login";
          }
        }
      } else {
        const authHeader = (
          options?.headers as Record<string, string> | undefined
        )?.Authorization;
        //Đây là trường hop khi ma chúng ta vẫn còn accessToken còn hạn
        //Và chúng ta gọi API ở Next.js server (Route handler, Server component đến server backend)
        const accessToken = authHeader ? authHeader.split("Bearer ")[1] : "";
        redirect(`/logout?sessionToken=${accessToken}`);
      }
    } else {
      throw new HttpError(
        data as {
          status: number;
          payload: {
            message: string;
            [key: string]: unknown;
          };
        },
      );
    }
  }
  // Đảm bảo logic dưới đây chỉ chạy ở phía client (browser)
  if (isClient) {
    const normalizeUrl = normalizePath(url);
    if (
      ["api/auth/login", "api/guest/auth/login"].includes(normalizeUrl) ||
      normalizeUrl === "api/auth/refresh-token"
    ) {
      const { accessToken, refreshToken } = (payload as LoginResType).data;
      setAccessTokenToLocalStorage(accessToken);
      setRefreshTokenToLocalStorage(refreshToken);
    } else if ("api/auth/token" === normalizeUrl) {
      const { accessToken, refreshToken } = payload as {
        accessToken: string;
        refreshToken: string;
      };
      setAccessTokenToLocalStorage(accessToken);
      setRefreshTokenToLocalStorage(refreshToken);
    } else if (
      ["api/auth/logout", "api/guest/auth/logout"].includes(normalizeUrl)
    ) {
      removeTokensFromLocalStorage();
    }
  }
  return data;
};

const http = {
  get<Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined,
  ) {
    return request<Response>("GET", url, options);
  },
  post<Response>(
    url: string,
    body: unknown,
    options?: Omit<CustomOptions, "body"> | undefined,
  ) {
    return request<Response>("POST", url, { ...options, body });
  },
  put<Response>(
    url: string,
    body: unknown,
    options?: Omit<CustomOptions, "body"> | undefined,
  ) {
    return request<Response>("PUT", url, { ...options, body });
  },
  delete<Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined,
  ) {
    return request<Response>("DELETE", url, { ...options });
  },
};

export default http;
