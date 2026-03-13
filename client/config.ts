import { z } from "zod";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
  NEXT_PUBLIC_URL: z.string(),
});

const configServer = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
});

if (!configServer.success) {
  console.error(configServer.error.issues);
  throw new Error("Các giá trị khai báo trong file .env không hợp lệ");
}

const envConfig = configServer.data;
export default envConfig;
