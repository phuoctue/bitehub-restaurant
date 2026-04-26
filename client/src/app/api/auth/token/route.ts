
import { cookies } from "next/headers";
import { HttpError } from "@/lib/http";
import { jwtDecode } from "jwt-decode";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const { accessToken, refreshToken } = body;
  const cookieStore = await cookies();
  try {
    const decodedAccessToken = jwtDecode(accessToken) as { exp: number };
    const decodedRefreshToken = jwtDecode(refreshToken) as { exp: number };

    // Lưu vào Cookie phía Next.js Server
    cookieStore.set("accessToken", accessToken, {
      path: "/",
      httpOnly: true, //chỉ server đọc, không JS client
      sameSite: "lax", //Bảo mật CSRF
      secure: true, // Chỉ HTTPS
      expires: decodedAccessToken.exp * 1000, // Chuyển từ seconds sang ms
    });
    cookieStore.set("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      expires: decodedRefreshToken.exp * 1000,
    });

    return Response.json(body)
} catch (error) {
  if (error instanceof HttpError) {
    return Response.json(error.payload, {
      status: error.status
    })
  } else {
    return Response.json({
      message: 'Có lỗi xảy ra',
    }, {
      status: 500
    })
  }
}

}
