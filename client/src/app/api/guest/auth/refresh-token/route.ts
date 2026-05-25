import { cookies } from "next/headers";
import { HttpError } from "@/lib/http";
import { jwtDecode } from "jwt-decode";
import guestApiRequest from "@/apiRequest/guest";

async function handleRefreshToken() {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) {
    return Response.json(
      {
        message: "Không tìm thấy refreshToken",
      },
      {
        status: 401,
      },
    );
  }
  try {
    const { payload } = await guestApiRequest.sRefreshToken({ refreshToken });

    const decodedAccessToken = jwtDecode(payload.data.accessToken) as {
      exp: number;
    };
    const decodedRefreshToken = jwtDecode(payload.data.refreshToken) as {
      exp: number;
    };

    // Lưu vào Cookie phía Next.js Server
    cookieStore.set("accessToken", payload.data.accessToken, {
      path: "/",
      httpOnly: true, //chỉ server đọc, không JS client
      sameSite: "lax", //Bảo mật CSRF
      secure: isProduction,
      expires: decodedAccessToken.exp * 1000, // Chuyển từ seconds sang ms
    });
    cookieStore.set("refreshToken", payload.data.refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      expires: decodedRefreshToken.exp * 1000,
    });

    return Response.json({
      message: payload.message,
      data: {
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
      },
    });
  } catch (error: any) {
    console.log(error);
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    } else {
      return Response.json(
        {
          message: error.message || "Lỗi hệ thống",
        },
        {
          status: error.status || 401,
        },
      );
    }
  }
}

export async function POST() {
  return handleRefreshToken();
}

export async function GET() {
  return handleRefreshToken();
}

