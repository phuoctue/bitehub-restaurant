"use client";

import { getAccessTokenFromLocalStorage } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

const menuItems = [
  {
    title: "Món ăn",
    href: "/menu",
  },
  {
    title: "Đơn hàng",
    href: "/orders", //authRequired: undefined nghĩa là login hay chưa đều cho hiển thị
  },
  {
    title: "Đăng nhập",
    href: "/login",
    authRequired: false, //khi false nghĩa là chưa đăng nhập sẽ hiển thị
  },
  {
    title: "Quản lý",
    href: "/manage/dashboard",
    authRequired: true, //true nghĩa là đăng nhập mới hiển thị
  },
];

//Server: món ăn, đăng nhập, đơn hàng.Do server không biết trang thái login của user
//Client: đầu tiền client sẽ hiển thị món ăn, đăng nhập. Nhưng ngay sau đó thì client render ra là món ăn, đơn hàng, quản lý
//do đã check đc trạng thái đăng nhập

export default function NavItems({ className }: { className?: string }) {
  const [isAuth, setIsAuth] = useState(false);
  useEffect(() => {
    setIsAuth(Boolean(getAccessTokenFromLocalStorage()));
  }, []);
  return menuItems.map((item) => {
    // const isAuth = Boolean(getAccessTokenFromLocalStorage());
    if (
      (item.authRequired === false && isAuth) || // Đăng nhập: ẩn khi đã login
      (item.authRequired === true && !isAuth) // Quản lý: ẩn khi chưa login
    )
      return null;
    return (
      <Link href={item.href} key={item.href} className={className}>
        {item.title}
      </Link>
    );
  });
}
