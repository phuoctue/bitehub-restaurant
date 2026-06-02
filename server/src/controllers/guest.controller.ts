import envConfig from '@/config'
import { DishStatus, OrderStatus, Role, TableStatus } from '@/constants/type'
import prisma from '@/database'
import {
  GuestCreateOrdersBodyType,
  GuestLoginBodyType,
  GuestRecommendationsQueryType
} from '@/schemaValidations/guest.schema'
import { TokenPayload } from '@/types/jwt.types'
import { AuthError, StatusError } from '@/utils/errors'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import ms from 'ms'

export const guestLoginController = async (body: GuestLoginBodyType) => {
  let guest = await prisma.$transaction(async (tx) => {
    const table = await tx.table.findUnique({
      where: {
        number: body.tableNumber,
        token: body.token
      }
    })
    if (!table) {
      throw new Error('Bàn không tồn tại hoặc mã token không đúng')
    }

    if (table.status === TableStatus.Hidden) {
      throw new Error('Bàn này đã bị ẩn, hãy chọn bàn khác để đăng nhập')
    }

    if (table.status === TableStatus.Reserved) {
      throw new Error('Bàn đang được sử dụng, hãy liên hệ nhân viên để được hỗ trợ')
    }

    const guest = await tx.guest.create({
      data: {
        name: body.name,
        tableNumber: body.tableNumber
      }
    })

    await tx.table.update({
      where: {
        number: body.tableNumber
      },
      data: {
        status: TableStatus.Reserved
      }
    })

    return guest
  })
  const refreshToken = signRefreshToken(
    {
      userId: guest.id,
      role: Role.Guest
    },
    {
      expiresIn: ms(envConfig.GUEST_REFRESH_TOKEN_EXPIRES_IN)
    }
  )
  const accessToken = signAccessToken(
    {
      userId: guest.id,
      role: Role.Guest
    },
    {
      expiresIn: ms(envConfig.GUEST_ACCESS_TOKEN_EXPIRES_IN)
    }
  )
  const decodedRefreshToken = verifyRefreshToken(refreshToken)
  const refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000)

  guest = await prisma.guest.update({
    where: {
      id: guest.id
    },
    data: {
      refreshToken,
      refreshTokenExpiresAt
    }
  })

  return {
    guest,
    accessToken,
    refreshToken
  }
}

export const guestLogoutController = async (id: number) => {
  await prisma.$transaction(async (tx) => {
    const guest = await tx.guest.update({
      where: {
        id
      },
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null
      }
    })

    if (guest.tableNumber !== null) {
      const activeOrders = await tx.order.count({
        where: {
          tableNumber: guest.tableNumber,
          status: {
            in: [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered]
          }
        }
      })

      if (activeOrders === 0) {
        await tx.table.update({
          where: {
            number: guest.tableNumber
          },
          data: {
            status: TableStatus.Available
          }
        })
      }
    }
  })
  return 'Đăng xuất thành công'
}

export const guestRefreshTokenController = async (refreshToken: string) => {
  let decodedRefreshToken: TokenPayload
  try {
    decodedRefreshToken = verifyRefreshToken(refreshToken)
  } catch (error) {
    throw new AuthError('Refresh token không hợp lệ')
  }
  const newRefreshToken = signRefreshToken({
    userId: decodedRefreshToken.userId,
    role: Role.Guest,
    exp: decodedRefreshToken.exp
  })
  const newAccessToken = signAccessToken(
    {
      userId: decodedRefreshToken.userId,
      role: Role.Guest
    },
    {
      expiresIn: ms(envConfig.GUEST_ACCESS_TOKEN_EXPIRES_IN)
    }
  )
  await prisma.guest.update({
    where: {
      id: decodedRefreshToken.userId
    },
    data: {
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000)
    }
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  }
}

export const guestCreateOrdersController = async (guestId: number, body: GuestCreateOrdersBodyType) => {
  const result = await prisma.$transaction(async (tx) => {
    const guest = await tx.guest.findUniqueOrThrow({
      where: {
        id: guestId
      }
    })
    if (guest.tableNumber === null) {
      throw new Error('Bàn của bạn đã bị xóa, vui lòng đăng xuất và đăng nhập lại một bàn mới')
    }
    const table = await tx.table.findUniqueOrThrow({
      where: {
        number: guest.tableNumber
      }
    })
    if (table.status === TableStatus.Hidden) {
      throw new Error(`Bàn ${table.number} đã bị ẩn, vui lòng đăng xuất và chọn bàn khác`)
    }
    const orders = []
    for (const order of body) {
      const dish = await tx.dish.findUniqueOrThrow({
        where: {
          id: order.dishId
        }
      })
      if (dish.status === DishStatus.Unavailable) {
        throw new Error(`Món ${dish.name} đã hết`)
      }
      if (dish.status === DishStatus.Hidden) {
        throw new Error(`Món ${dish.name} không thể đặt`)
      }
      const dishSnapshot = await tx.dishSnapshot.create({
        data: {
          description: dish.description,
          descriptionEn: dish.descriptionEn,
          image: dish.image,
          name: dish.name,
          nameEn: dish.nameEn,
          price: dish.price,
          dishId: dish.id,
          status: dish.status
        }
      })
      const orderRecord = await tx.order.create({
        data: {
          dishSnapshotId: dishSnapshot.id,
          guestId,
          quantity: order.quantity,
          tableNumber: guest.tableNumber,
          orderHandlerId: null,
          status: OrderStatus.Pending
        },
        include: {
          dishSnapshot: true,
          guest: true,
          orderHandler: true
        }
      })
      type OrderRecord = typeof orderRecord
      orders.push(
        orderRecord as OrderRecord & {
          status: (typeof OrderStatus)[keyof typeof OrderStatus]
          dishSnapshot: OrderRecord['dishSnapshot'] & {
            status: (typeof DishStatus)[keyof typeof DishStatus]
          }
        }
      )
    }
    await tx.table.update({
      where: {
        number: guest.tableNumber
      },
      data: {
        status: TableStatus.Reserved
      }
    })
    return orders
  })
  return result
}

export const guestGetOrdersController = async (guestId: number) => {
  const orders = await prisma.order.findMany({
    where: {
      guestId
    },
    include: {
      dishSnapshot: true,
      orderHandler: true,
      guest: true
    }
  })
  return orders
}

type RecommendationDish = {
  dishId: number
  name: string
  nameEn?: string | null
  price: number
  image: string
  score: number
  reasons: string[]
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const clampToUnit = (value: number) => Math.max(0, Math.min(1, value))

export const guestGetRecommendationsController = async (guestId: number, query: GuestRecommendationsQueryType) => {
  const limit = query.limit ?? 8
  const guest = await prisma.guest.findUniqueOrThrow({
    where: { id: guestId }
  })

  const now = new Date()
  const from7Days = new Date(now.getTime() - 7 * ONE_DAY_MS)
  const from30Days = new Date(now.getTime() - 30 * ONE_DAY_MS)
  const currentHour = now.getHours()
  const dayOfWeek = now.getDay()

  const dishes = await prisma.dish.findMany({
    where: {
      status: DishStatus.Available
    },
    select: {
      id: true,
      name: true,
      nameEn: true,
      price: true,
      image: true
    }
  })

  if (dishes.length === 0) return []

  const paidOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.Paid,
      createdAt: { gte: from30Days }
    },
    select: {
      quantity: true,
      tableNumber: true,
      createdAt: true,
      dishSnapshot: {
        select: {
          dishId: true
        }
      }
    }
  })

  const tableHistory = new Map<number, number>()
  const globalPopular7Days = new Map<number, number>()
  const timeMatch7Days = new Map<number, number>()
  const trendToday = new Map<number, number>()
  const trendPast3Days = new Map<number, number>()

  const from3Days = new Date(now.getTime() - 3 * ONE_DAY_MS)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (const order of paidOrders) {
    const dishId = order.dishSnapshot.dishId
    if (!dishId) continue

    const qty = order.quantity
    const orderHour = order.createdAt.getHours()

    if (guest.tableNumber !== null && order.tableNumber === guest.tableNumber) {
      tableHistory.set(dishId, (tableHistory.get(dishId) ?? 0) + qty)
    }

    if (order.createdAt >= from7Days) {
      globalPopular7Days.set(dishId, (globalPopular7Days.get(dishId) ?? 0) + qty)
      if (Math.abs(orderHour - currentHour) <= 2) {
        timeMatch7Days.set(dishId, (timeMatch7Days.get(dishId) ?? 0) + qty)
      }
    }

    if (order.createdAt >= startOfToday) {
      trendToday.set(dishId, (trendToday.get(dishId) ?? 0) + qty)
    } else if (order.createdAt >= from3Days) {
      trendPast3Days.set(dishId, (trendPast3Days.get(dishId) ?? 0) + qty)
    }
  }

  const maxTable = Math.max(...Array.from(tableHistory.values()), 1)
  const maxGlobal = Math.max(...Array.from(globalPopular7Days.values()), 1)
  const maxTime = Math.max(...Array.from(timeMatch7Days.values()), 1)

  const recommendations: RecommendationDish[] = dishes.map((dish) => {
    const tableRaw = tableHistory.get(dish.id) ?? 0
    const globalRaw = globalPopular7Days.get(dish.id) ?? 0
    const timeRaw = timeMatch7Days.get(dish.id) ?? 0
    const todayRaw = trendToday.get(dish.id) ?? 0
    const past3DaysRaw = trendPast3Days.get(dish.id) ?? 0
    const trendRaw = todayRaw / ((past3DaysRaw / 3 || 1) + 1)

    const tableScore = clampToUnit(tableRaw / maxTable)
    const globalScore = clampToUnit(globalRaw / maxGlobal)
    const timeScore = clampToUnit(timeRaw / maxTime)
    const trendScore = clampToUnit(trendRaw / 3)

    const score = Number((0.35 * tableScore + 0.25 * globalScore + 0.2 * timeScore + 0.2 * trendScore).toFixed(4))
    const reasons: string[] = []
    if (tableScore >= 0.45) reasons.push('Hay gọi ở bàn này')
    if (globalScore >= 0.6) reasons.push('Đang bán chạy')
    if (timeScore >= 0.5) reasons.push(`Phù hợp khung giờ ${currentHour}h`)
    if (trendScore >= 0.6) reasons.push('Đang hot gần đây')
    if (reasons.length === 0) reasons.push('Đề xuất từ món phổ biến')

    return {
      dishId: dish.id,
      name: dish.name,
      nameEn: dish.nameEn,
      price: dish.price,
      image: dish.image,
      score,
      reasons
    }
  })

  recommendations.sort((a, b) => b.score - a.score)
  const topRecommendations = recommendations.slice(0, limit)

  await prisma.recommendationLog.createMany({
    data: topRecommendations.map((item) => ({
      guestId,
      tableNumber: guest.tableNumber,
      dishId: item.dishId,
      score: item.score,
      reasons: item.reasons,
      contextHour: currentHour,
      contextDayOfWeek: dayOfWeek
    }))
  })

  return topRecommendations
}

export const guestRecommendationClickController = async (guestId: number, dishId: number) => {
  const record = await prisma.recommendationLog.findFirst({
    where: {
      guestId,
      dishId,
      clickedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (!record) {
    return 'Không tìm thấy lượt gợi ý phù hợp để ghi nhận click'
  }

  await prisma.recommendationLog.update({
    where: { id: record.id },
    data: { clickedAt: new Date() }
  })

  return 'Ghi nhận click gợi ý thành công'
}
