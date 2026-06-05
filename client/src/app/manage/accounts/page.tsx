import AccountTable from "@/app/manage/accounts/account-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export default async function AccountsPage() {
  const t = await getTranslations("ManageCommon");

  return (
    <main className="grid flex-1 items-start gap-4 p-3 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <Card className="overflow-hidden" x-chunk="dashboard-06-chunk-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>{t("accounts")}</CardTitle>
            <CardDescription>{t("accountsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <Suspense>
              <AccountTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
