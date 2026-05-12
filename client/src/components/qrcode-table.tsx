"use client";
import { getTableLink } from "@/lib/utils";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";

export default function QRCodeTable({
  token,
  tableNumber,
  width = 250,
}: {
  token: string;
  tableNumber: number;
  width?: number;
}) {
  const locale = useLocale();
  const isEn = locale === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.height = width + 70;
    canvas.width = width;
    const canvasContext = canvas.getContext("2d")!;
    canvasContext.fillStyle = "white";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    canvasContext.font = "20px Arial";
    canvasContext.textAlign = "center";
    canvasContext.fillStyle = "black";
    canvasContext.fillText(
      isEn ? `Table ${tableNumber}` : `Bàn số ${tableNumber}`,
      canvas.width / 2,
      canvas.width + 20,
    );
    canvasContext.fillText(
      isEn ? "Scan QR to order" : "Quét mã QR để gọi món",
      canvas.width / 2,
      canvas.width + 50,
    );
    const virtalCanvas = document.createElement("canvas");
    QRCode.toCanvas(
      virtalCanvas,
      getTableLink({
        token,
        tableNumber,
      }),
      function (error) {
        if (error) console.error(error);
        canvasContext.drawImage(virtalCanvas, 0, 0, width, width);
      },
    );
  }, [token, width, tableNumber, isEn]);
  return <canvas ref={canvasRef} />;
}
