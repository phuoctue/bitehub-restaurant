import authApiRequest from "@/apiRequest/auth";
import { LoginBodyType } from "@/schemaValidations/auth.schema";
import { cookies } from "next/headers";
import { HttpError } from "@/lib/http";
import { jwtDecode } from "jwt-decode";

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBodyType;
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  try {
    const { payload } = await authApiRequest.sLogin(body);
    const { accessToken, refreshToken } = payload.data;
    const decodedAccessToken = jwtDecode(accessToken) as { exp: number };
    const decodedRefreshToken = jwtDecode(refreshToken) as { exp: number };

    cookieStore.set("accessToken", accessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      expires: decodedAccessToken.exp * 1000,
    });

    cookieStore.set("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      expires: decodedRefreshToken.exp * 1000,
    });

    return Response.json({
      message: payload.message,
      data: {
        accessToken,
        refreshToken,
        account: payload.data.account,
      },
    });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    }

    return Response.json(
      {
        message: error.message || "Loi he thong",
      },
      {
        status: error.status || 500,
      },
    );
  }
}
