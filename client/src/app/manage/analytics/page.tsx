import { getTranslations } from "next-intl/server";

export default async function Analytics() {
  const t = await getTranslations("ManageCommon");

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t("analytics")}</h1>
        <p className="mt-2 text-gray-500">{t("analyticsInProgress")}</p>
      </div>
    </div>
  );
}
