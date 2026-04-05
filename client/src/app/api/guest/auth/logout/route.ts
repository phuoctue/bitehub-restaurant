import guestApiRequest from "@/apiRequest/guest";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!accessToken || !refreshToken) {
    return Response.json(
      { message: "Không tìm thấy token" },
      {
        status: 200,
      },
    );
  }
  try {
    await guestApiRequest.sLogout();
  } catch (error) {
    console.log(error);
    // Nếu logout ở server backend lỗi thì vẫn tiếp tục xóa cookie ở client
  } finally {
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return Response.json({
      message: "Đăng xuất thành công",
    });
  }
}
