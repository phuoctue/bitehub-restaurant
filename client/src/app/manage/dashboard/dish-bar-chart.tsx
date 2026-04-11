'use client'
import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// FIX: Dùng trực tiếp biến hsl var(--chart-x) đã định nghĩa trong globals.css
const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
]

const chartConfig = {
  successOrders: {
    label: 'Số lượng bán',
    color: 'hsl(var(--chart-1))'
  }
} satisfies ChartConfig

interface DishIndicator {
  name: string
  successOrders: number
}

interface DishBarChartProps {
  data: DishIndicator[]
}

export function DishBarChart({ data = [] }: DishBarChartProps) {
  const chartData = data.map((dish, index) => ({
    name: dish.name,
    successOrders: dish.successOrders,
    fill: colors[index % colors.length]
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top món ăn</CardTitle>
        <CardDescription>Món ăn được gọi nhiều nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout='vertical'
            margin={{ left: 30, right: 30 }}
          >
            <YAxis
              dataKey='name'
              type='category'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100}
            />
            <XAxis type='number' dataKey='successOrders' hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            {/* FIX: Bỏ layout='vertical' ở Bar vì nó đã nằm ở BarChart phía trên */}
            <Bar dataKey='successOrders' radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col items-start gap-2 text-sm'>
        <div className='flex gap-2 font-medium leading-none'>
          Thống kê theo đơn hàng thành công <TrendingUp className='h-4 w-4' />
        </div>
      </CardFooter>
    </Card>
  )
}