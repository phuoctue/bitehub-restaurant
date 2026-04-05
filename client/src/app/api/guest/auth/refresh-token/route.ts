import { cookies } from "next/headers";
import { HttpError } from "@/lib/http";
import { jwtDecode } from "jwt-decode";
import guestApiRequest from "@/apiRequest/guest";

export async function POST(request: Request) {
  const cookieStore = await cookies();
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
      secure: true, // Chỉ HTTPS
      expires: decodedAccessToken.exp * 1000, // Chuyển từ seconds sang ms
    });
    cookieStore.set("refreshToken", payload.data.refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      expires: decodedRefreshToken.exp * 1000,
    });

    return Response.json(payload);
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
