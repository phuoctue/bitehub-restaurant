import authApiRequest from "@/apiRequest/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!accessToken || !refreshToken) {
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return Response.json(
      { message: "Khong tim thay token, da xoa cookie con sot lai" },
      {
        status: 200,
      },
    );
  }

  try {
    await authApiRequest.sLogout();
  } catch (error) {
    // Neu logout o server backend loi thi van tiep tuc xoa cookie o client
  } finally {
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return Response.json({
      message: "Dang xuat thanh cong",
    });
  }
}
