import React from "react";
import OrdersCart from "./orders-cart";

export default function OrdersPage() {
  return (
    <div className="max-w-[400px] mx-auto px-4 pb-20 space-y-6">
      <h1 className="text-center text-2xl font-bold pt-6">🛒 Đơn hàng đã đặt</h1>
      <OrdersCart />
    </div>
  );
}
