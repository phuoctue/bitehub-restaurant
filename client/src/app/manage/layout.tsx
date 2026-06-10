import { getTranslations } from "next-intl/server";
import ManageShell from "./manage-shell";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = await getTranslations("ManageCommon");

  return (
    <ManageShell
      labels={{
        dashboard: t("dashboard"),
        orders: t("orders"),
        tables: t("tables"),
        dishes: t("dishes"),
        employees: t("employees"),
        settings: t("settings"),
        support: t("support"),
        logout: t("logout"),
        home: t("home"),
        user: t("user"),
        toggleMenu: t("toggleMenu"),
      }}
    >
      {children}
    </ManageShell>
  );
}
