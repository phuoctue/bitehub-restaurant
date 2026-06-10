import { z } from "zod";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
  NEXT_PUBLIC_URL: z.string(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
  NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI: z.string(),
  NEXT_PUBLIC_VIETQR_BANK_ID: z.string().optional(),
  NEXT_PUBLIC_VIETQR_ACCOUNT_NO: z.string().optional(),
  NEXT_PUBLIC_VIETQR_ACCOUNT_NAME: z.string().optional(),
  NEXT_PUBLIC_VIETQR_TEMPLATE: z.string().optional(),
  NEXT_PUBLIC_VIETQR_TRANSFER_PREFIX: z.string().optional(),
});

const configServer = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI,
  NEXT_PUBLIC_VIETQR_BANK_ID: process.env.NEXT_PUBLIC_VIETQR_BANK_ID,
  NEXT_PUBLIC_VIETQR_ACCOUNT_NO: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO,
  NEXT_PUBLIC_VIETQR_ACCOUNT_NAME: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME,
  NEXT_PUBLIC_VIETQR_TEMPLATE: process.env.NEXT_PUBLIC_VIETQR_TEMPLATE,
  NEXT_PUBLIC_VIETQR_TRANSFER_PREFIX: process.env.NEXT_PUBLIC_VIETQR_TRANSFER_PREFIX,
});

if (!configServer.success) {
  console.error(configServer.error.issues);
  throw new Error("Các giá trị khai báo trong file .env không hợp lệ");
}

const envConfig = configServer.data;
export default envConfig;
