import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { EntityError, HttpError } from "@/lib/http";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import authApiRequest from "@/apiRequest/auth";
import { DishStatus, TableStatus } from "@/constants/type";
import envConfig from "@/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

export const handleErrorApi = <TFieldValues extends FieldValues>({
  error,
  setError,
  duration,
}: {
  error: unknown;
  setError?: UseFormSetError<TFieldValues>;
  duration?: number;
}) => {
  const defaultMessage = "Lỗi không xác định";

  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field as Path<TFieldValues>, {
        type: "server",
        message: item.message,
      });
    });
    return;
  }

  let message = defaultMessage;

  if (error instanceof HttpError) {
    message = error.payload?.message || error.message || defaultMessage;
  } else if (error instanceof Error) {
    message = error.message || defaultMessage;
  } else if (typeof error === "object" && error !== null) {
    const unknownError = error as {
      payload?: { message?: string };
      message?: string;
    };
    message =
      unknownError.payload?.message || unknownError.message || defaultMessage;
  }

  toast.error(message, {
    duration: duration ?? 5000,
  });
};

export const getAccessTokenFromLocalStorage = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

export const getRefreshTokenFromLocalStorage = () =>
  typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

export const setAccessTokenToLocalStorage = (value: string) =>
  typeof window !== "undefined" && localStorage.setItem("accessToken", value);

export const setRefreshTokenToLocalStorage = (value: string) =>
  typeof window !== "undefined" && localStorage.setItem("refreshToken", value);

export const removeTokensFromLocalStorage = () => {
  typeof window !== "undefined" && localStorage.removeItem("accessToken");
  typeof window !== "undefined" && localStorage.removeItem("refreshToken");
};

export const checkAndRefreshToken = async (param?: {
  onError?: () => void;
  onSuccess?: () => void;
}) => {
  //khong nen dua logic lay access va refresh token ra khỏi func nay
  //vi de moi lan ma func nay dc goi thi chung ta se co 1 access va refresh token moi
  //tranh hien tuong bug no lay access va refresh token cũ ở lần đầu roi goi cho lan tiep theo
  const accessToken = getAccessTokenFromLocalStorage();
  const refreshToken = getRefreshTokenFromLocalStorage();
  //chua login thi cung khong cho chay
  if (!accessToken || !refreshToken) {
    param?.onError && param.onError();
    return;
  }
  //check token co het han khong
  const decodedAccessToken = jwtDecode(accessToken) as {
    exp: number;
    iat: number;
  };
  const decodedRefreshToken = jwtDecode(refreshToken) as {
    exp: number;
    iat: number;
  };
  //thoi điểm het han cua token la tính th epoch time (s)
  //còn khi sai cu pháp new Date().getTime() thi se tra ve epock time (ms)
  const now = Math.round(new Date().getTime() / 1000);
  // truong hop refresh token hết hạn thì kh xử lý nữa
  if (decodedRefreshToken.exp <= now) {
    //Bao loi de chuyen ve login
    removeTokensFromLocalStorage();
    param?.onError && param.onError();
    return;
  }
  //vd nếu access token của chúng ta có thời gian hết han là 10s
  //thì sẽ check 1/3 thời gian (3s) thì sẽ cho refresh token lại
  //thoi gian còn lại sẽ đc tính dựa trên cong thức: decodedAccessToken.exp - now
  //thoi gian hết hạn của access token dựa trên cong thuc:  decodedAccessToken.exp - decodedAccessToken.iat (time hết hạn - time khởi tạo)
  // Nếu Access Token còn hạn lâu (chưa quá 1/3) -> Vẫn coi là thành công để cho user vào tiếp
  if (
    decodedAccessToken.exp - now >=
    (decodedAccessToken.exp - decodedAccessToken.iat) / 3
  ) {
    param?.onSuccess && param.onSuccess();
    return;
  }
  if (
    decodedAccessToken.exp - now <
    (decodedAccessToken.exp - decodedAccessToken.iat) / 3
  ) {
    //goi api refresh token
    try {
      const res = await authApiRequest.refreshToken();
      setAccessTokenToLocalStorage(res.payload.data.accessToken);
      setRefreshTokenToLocalStorage(res.payload.data.refreshToken);
      param?.onSuccess && param.onSuccess();
    } catch (error) {
      param?.onError && param.onError();
    }
  }
};

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(number)
}

export const getVietnameseDishStatus = (status: (typeof DishStatus)[keyof typeof DishStatus]) => {
  switch (status) {
    case DishStatus.Available:
      return 'Có sẵn'
    case DishStatus.Unavailable:
      return 'Không có sẵn'
    default:
      return 'Ẩn'
  }
}

export const getVietnameseTableStatus = (status: (typeof TableStatus)[keyof typeof TableStatus]) => {
  switch (status) {
    case TableStatus.Available:
      return 'Có sẵn'
    case TableStatus.Reserved:
      return 'Đã đặt'
    default:
      return 'Ẩn'
  }
}
export const getTableLink = ({ token, tableNumber }: { token: string; tableNumber: number }) => {
  return envConfig.NEXT_PUBLIC_URL + '/tables/' + tableNumber + '?token=' + token
}
