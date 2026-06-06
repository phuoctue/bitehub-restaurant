import { DashboardIndicatorQueryParamsType } from '@/schemaValidations/indicator.schema'
import prisma from '@/database'
import { startOfDay, endOfDay } from 'date-fns'
import { Prisma } from '@prisma/client'

export const getIndicatorsController = async (queryParams: DashboardIndicatorQueryParamsType) => {
  const { fromDate, toDate } = queryParams

  // 1. Lấy danh sách đơn hàng đã thanh toán trong khoảng thời gian
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startOfDay(new Date(fromDate)),
        lte: endOfDay(new Date(toDate))
      },
      status: 'Paid' // Chỉ tính các đơn đã thanh toán thành công
    },
    include: {
      dishSnapshot: true,
      guest: true
    }
  })

  // 2. Tính toán các chỉ số
  const revenue = orders.reduce((sum, order) => sum + order.dishSnapshot.price * order.quantity, 0)
  const guestCount = new Set(orders.map((order) => order.guestId)).size
  const orderCount = orders.length

  // 3. Đếm số bàn đang phục vụ (không phụ thuộc vào khoảng thời gian)
  const servingTableCount = await prisma.table.count({
    where: { status: 'Reserved' }
  })

  // 4. Thống kê món ăn (Dish Indicator)
  const dishMap: Record<string, { dishSnapshot: (typeof orders)[0]['dishSnapshot']; successOrders: number }> = {}
  orders.forEach((order) => {
    const dishName = order.dishSnapshot.name
    if (!dishMap[dishName]) {
      dishMap[dishName] = { dishSnapshot: order.dishSnapshot, successOrders: 0 }
    }
    dishMap[dishName].successOrders += order.quantity
  })
  const dishIndicator = Object.values(dishMap)
    .map((item) => ({
      ...item.dishSnapshot,
      successOrders: item.successOrders
    }))
    .sort((a, b) => b.successOrders - a.successOrders)
    .slice(0, 5) // Lấy top 5 món

  // 5. Doanh thu theo ngày (Revenue By Date)
  // Logic này gom nhóm doanh thu theo ngày để vẽ biểu đồ Line Chart
  const revenueMap: Record<string, number> = {}
  orders.forEach((order) => {
    const dateStr = order.createdAt.toLocaleDateString('vi-VN') // dd/mm/yyyy
    revenueMap[dateStr] = (revenueMap[dateStr] || 0) + order.dishSnapshot.price * order.quantity
  })
  const revenueByDate = Object.keys(revenueMap).map((date) => ({
    date,
    revenue: revenueMap[date]
  }))

  return {
    revenue,
    guestCount,
    orderCount,
    servingTableCount,
    dishIndicator,
    revenueByDate
  }
}
