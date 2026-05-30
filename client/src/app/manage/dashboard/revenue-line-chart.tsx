"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, parse } from "date-fns";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))"
  }
} satisfies ChartConfig;

type RevenuePoint = {
  date: string;
  revenue: number;
};

interface RevenueLineChartProps {
  data?: RevenuePoint[];
}

export function RevenueLineChart({ data = [] }: RevenueLineChartProps) {
  const t = useTranslations("ManageDashboard");
  const chartData = [...data].sort((a, b) => {
    const dateA = parse(a.date, "dd/MM/yyyy", new Date()).getTime();
    const dateB = parse(b.date, "dd/MM/yyyy", new Date()).getTime();
    return dateA - dateB;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("revenueChartTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (chartData.length < 8) return value;
                if (chartData.length < 33) {
                  const date = parse(value, "dd/MM/yyyy", new Date());
                  return format(date, "dd");
                }
                return "";
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Line dataKey="revenue" name={t("revenueLegend")} type="linear" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm" />
    </Card>
  );
}
