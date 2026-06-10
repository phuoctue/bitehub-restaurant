import envConfig from "@/config";

export type PaymentQrData = {
  bankId: string;
  accountNo: string;
  accountName: string;
  template: string;
  transferPrefix: string;
  amount: number;
  transferContent: string;
  imageUrl: string;
};

const normalizePrefix = (value?: string) => value?.trim() || "Thanh toan don hang";

const normalizeVietQrBankId = (value?: string) => {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalized) return "";

  const aliases: Record<string, string> = {
    TPBANK: "TPB",
    TPB: "TPB",
    MBBANK: "MB",
    MBB: "MB",
    VIETCOMBANK: "VCB",
    VIETINBANK: "VTB",
    BIDV: "BIDV",
    AGRIBANK: "VARB",
    TECHCOMBANK: "TCB",
    ACB: "ACB",
    SACOMBANK: "STB",
    VPBANK: "VPB",
    SHB: "SHB",
    HDBANK: "HDB",
    OCB: "OCB",
    EXIMBANK: "EIB",
    VIB: "VIB",
    MSB: "MSB",
    SEABANK: "SSB",
    LPBANK: "LPB",
    PGBANK: "PGB",
    KIENLONGBANK: "KLB",
    NAMABANK: "NAB",
    VIETABANK: "VAB",
    ABBANK: "ABBANK",
    PVCOMBANK: "PVCB",
    PUBLICBANK: "PBVN",
    WOORIBANK: "WB",
    UOB: "UOB",
    CIMB: "CIMB",
    KBANK: "KBANK",
  };

  return aliases[normalized] || normalized;
};

export const buildPaymentQrData = ({
  amount,
  invoiceNumber,
}: {
  amount: number;
  invoiceNumber: string;
}): PaymentQrData | null => {
  const bankId = normalizeVietQrBankId(envConfig.NEXT_PUBLIC_VIETQR_BANK_ID);
  const accountNo = envConfig.NEXT_PUBLIC_VIETQR_ACCOUNT_NO?.trim();
  const accountName = envConfig.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME?.trim();
  const template = envConfig.NEXT_PUBLIC_VIETQR_TEMPLATE?.trim() || "compact2";
  const transferPrefix = normalizePrefix(envConfig.NEXT_PUBLIC_VIETQR_TRANSFER_PREFIX);

  if (!bankId || !accountNo || !accountName || amount <= 0) {
    return null;
  }

  const transferContent = `${transferPrefix} #${invoiceNumber} - BiteHub`;
  const queryParams = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo: transferContent,
    accountName,
  });

  return {
    bankId,
    accountNo,
    accountName,
    template,
    transferPrefix,
    amount,
    transferContent,
    imageUrl: `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-${encodeURIComponent(template)}.png?${queryParams.toString()}`,
  };
};

export const formatInvoiceCurrency = (amount: number) => {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formattedAmount} đ`;
};
