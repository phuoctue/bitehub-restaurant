"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

interface DishIndicator {
  name: string;
  successOrders: number;
}

interface DishBarChartProps {
  data: DishIndicator[];
}

export function DishBarChart({ data = [] }: DishBarChartProps) {
  const t = useTranslations("ManageDashboard");
  const chartConfig = {
    successOrders: {
      label: t("soldQuantity"),
      color: "hsl(var(--chart-1))"
    }
  } satisfies ChartConfig;

  const chartData = data.map((dish, index) => ({
    name: dish.name,
    successOrders: dish.successOrders,
    fill: colors[index % colors.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topDishesTitle")}</CardTitle>
        <CardDescription>{t("topDishesDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 30, right: 30 }}>
            <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={100} />
            <XAxis type="number" dataKey="successOrders" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="successOrders" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {t("successOrderStats")} <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}
