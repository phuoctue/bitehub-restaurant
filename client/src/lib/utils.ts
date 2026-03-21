import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { EntityError, HttpError } from "@/lib/http";
import { toast } from "sonner";

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
