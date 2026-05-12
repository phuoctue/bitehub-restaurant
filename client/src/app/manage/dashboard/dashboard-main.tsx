"use client";

import { DishBarChart } from "@/app/manage/dashboard/dish-bar-chart";
import { RevenueLineChart } from "@/app/manage/dashboard/revenue-line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useDashboardIndicator } from "@/queries/useIndicator";
import { endOfDay, format, startOfDay } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";

const createDefaultDateRange = () => {
  const now = new Date();
  return {
    fromDate: startOfDay(now),
    toDate: endOfDay(now)
  };
};

export default function DashboardMain() {
  const t = useTranslations("ManageDashboard");
  const [fromDate, setFromDate] = useState(() => createDefaultDateRange().fromDate);
  const [toDate, setToDate] = useState(() => createDefaultDateRange().toDate);
  const { data } = useDashboardIndicator({
    fromDate,
    toDate
  });

  const revenue = data?.payload.data.revenue ?? 0;
  const guestCount = data?.payload.data.guestCount ?? 0;
  const orderCount = data?.payload.data.orderCount ?? 0;
  const servingTableCount = data?.payload.data.servingTableCount ?? 0;
  const revenueByDate = data?.payload.data.revenueByDate ?? [];
  const dishIndicator = data?.payload.data.dishIndicator ?? [];

  const resetDateFilter = () => {
    const { fromDate: nextFromDate, toDate: nextToDate } = createDefaultDateRange();
    setFromDate(nextFromDate);
    setToDate(nextToDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center">
          <span className="mr-2">{t("from")}</span>
          <input
            type="datetime-local"
            className="text-sm"
            value={format(fromDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
            onChange={(event) => setFromDate(new Date(event.target.value))}
          />
        </div>
        <div className="flex items-center">
          <span className="mr-2">{t("to")}</span>
          <input
            type="datetime-local"
            value={format(toDate, "yyyy-MM-dd HH:mm").replace(" ", "T")}
            onChange={(event) => setToDate(new Date(event.target.value))}
          />
        </div>
        <Button variant="outline" onClick={resetDateFilter}>
          {t("reset")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("guests")}</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestCount}</div>
            <p className="text-xs text-muted-foreground">{t("ordered")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("orders")}</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <p className="text-xs text-muted-foreground">{t("paid")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("servingTables")}</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servingTableCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueLineChart data={revenueByDate} />
        </div>
        <div className="lg:col-span-3">
          <DishBarChart data={dishIndicator} />
        </div>
      </div>
    </div>
  );
}
