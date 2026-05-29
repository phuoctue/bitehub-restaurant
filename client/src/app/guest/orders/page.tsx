import React from "react";
import OrdersCart from "./orders-cart";
import { useTranslations } from "next-intl";

export default function OrdersPage() {
  const t = useTranslations("GuestOrders");

  return (
    <div className="max-w-[400px] mx-auto px-4 pb-20 space-y-6">
      <h1 className="text-center text-2xl font-bold pt-6">{t("title")}</h1>
      <OrdersCart />
    </div>
  );
}
