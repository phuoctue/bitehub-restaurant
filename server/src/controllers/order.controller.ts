import { DishStatus, OrderStatus, TableStatus } from '@/constants/type'
import prisma from '@/database'
import { CreateOrdersBodyType, UpdateOrderBodyType } from '@/schemaValidations/order.schema'
import { generateInvoiceFromOrdersController } from '@/controllers/invoice.controller'
import { InvoiceLocale } from '@/utils/invoice'
import { Prisma } from '@prisma/client'

const ACTIVE_ORDER_STATUSES = [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered]

const syncTableStatusByNumber = async (tx: Prisma.TransactionClient, tableNumber: number) => {
  const table = await tx.table.findUnique({
    where: {
      number: tableNumber
    },
    select: {
      status: true
    }
  })
  if (!table || table.status === TableStatus.Hidden) return

  const activeOrders = await tx.order.count({
    where: {
      tableNumber,
      status: {
        in: ACTIVE_ORDER_STATUSES
      }
    }
  })

  await tx.table.update({
    where: {
      number: tableNumber
    },
    data: {
      status: activeOrders === 0 ? TableStatus.Available : TableStatus.Reserved
    }
  })
}

export const createOrdersController = async (orderHandlerId: number, body: CreateOrdersBodyType) => {
  const { guestId, orders } = body
  const guest = await prisma.guest.findUniqueOrThrow({
    where: {
      id: guestId
    },
    select: {
      id: true,
      tableNumber: true
    }
  })
  if (guest.tableNumber === null) {
    throw new Error('Bàn gắn liền với khách hàng này đã bị xóa, vui lòng chọn khách hàng khác!')
  }
  const table = await prisma.table.findUniqueOrThrow({
    where: {
      number: guest.tableNumber
    }
  })
  if (table.status === TableStatus.Hidden) {
    throw new Error(`Bàn ${table.number} gắn liền với khách hàng đã bị ẩn, vui lòng chọn khách hàng khác!`)
  }

<<<<<<< HEAD
  const [ordersRecord, socketRecord] = await Promise.all([
    prisma.$transaction(
      async (tx) => {
        const ordersRecord = []
        for (const order of orders) {
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
              orderHandlerId,
              status: OrderStatus.Pending
            },
            include: {
              dishSnapshot: true,
              guest: true,
              orderHandler: true
            }
          })
          type OrderRecord = typeof orderRecord
          ordersRecord.push(
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
            number: guest.tableNumber!
          },
          data: {
            status: TableStatus.Reserved
          }
        })
        return ordersRecord
      },
      {
        maxWait: 5000, // 🌟 Đợi tối đa 5 giây để giành kết nối
        timeout: 20000 // 🌟 Nới rộng thời gian xử lý lên 20 giây cho Render Free
      }
    ),
    prisma.socket.findUnique({
=======
  const ordersRecord = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const ordersRecord: any[] = []
    for (const order of orders) {
      const dish: any = await tx.dish.findUniqueOrThrow({
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
          orderHandlerId,
          status: OrderStatus.Pending
        },
        include: {
          dishSnapshot: true,
          guest: true,
          orderHandler: true
        }
      })
      type OrderRecord = typeof orderRecord
      ordersRecord.push(
        orderRecord as OrderRecord & {
          status: (typeof OrderStatus)[keyof typeof OrderStatus]
          dishSnapshot: OrderRecord['dishSnapshot'] & {
            status: (typeof DishStatus)[keyof typeof DishStatus]
          }
        }
      )
    }
    await tx.table.update({
>>>>>>> c3524500ff479fd12a2a955c66d5ebef9cf94d60
      where: {
        number: guest.tableNumber!
      },
      data: {
        status: TableStatus.Reserved
      }
    })
    return ordersRecord
  })

  const socketRecord = await prisma.socket.findUnique({
    where: {
      guestId: body.guestId
    }
  })

  return {
    orders: ordersRecord,
    socketId: socketRecord?.socketId
  }
}

export const getOrdersController = async ({ fromDate, toDate }: { fromDate?: Date; toDate?: Date }) => {
  const orders = await prisma.order.findMany({
    include: {
      dishSnapshot: true,
      orderHandler: true,
      guest: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      createdAt: {
        gte: fromDate,
        lte: toDate
      }
    }
  })
  return orders
}

// Controller thanh toán các hóa đơn dựa trên guestId
export const payOrdersController = async ({
  guestId,
  orderHandlerId,
  locale
}: {
  guestId: number
  orderHandlerId: number
  locale?: InvoiceLocale
}) => {
  const orders = await prisma.order.findMany({
    where: {
      guestId,
      status: {
        in: ACTIVE_ORDER_STATUSES
      }
    }
  })
  if (orders.length === 0) {
    throw new Error('Không có hóa đơn nào cần thanh toán')
  }
<<<<<<< HEAD
  await prisma.$transaction(
    async (tx) => {
      const orderIds = orders.map((order) => order.id)
      const updatedOrders = await tx.order.updateMany({
        where: {
          id: {
            in: orderIds
          }
        },
        data: {
          status: OrderStatus.Paid,
          orderHandlerId
        }
      })
      const tableNumbers = Array.from(
        new Set(
          orders.map((order) => order.tableNumber).filter((tableNumber): tableNumber is number => tableNumber !== null)
        )
=======
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const orderIds = orders.map((order) => order.id)
    const updatedOrders = await tx.order.updateMany({
      where: {
        id: {
          in: orderIds
        }
      },
      data: {
        status: OrderStatus.Paid,
        orderHandlerId
      }
    })
    const tableNumbers = Array.from(
      new Set(
        orders.map((order: any) => order.tableNumber).filter((tableNumber): tableNumber is number => tableNumber !== null)
>>>>>>> c3524500ff479fd12a2a955c66d5ebef9cf94d60
      )
      for (const tableNumber of tableNumbers) {
        await syncTableStatusByNumber(tx, tableNumber)
      }
      return updatedOrders
    },
    {
      maxWait: 5000,
      timeout: 20000 // 🌟 Thêm timeout 20s cho luồng thanh toán
    }
  )
  const [ordersResult, sockerRecord] = await Promise.all([
    prisma.order.findMany({
      where: {
        id: {
          in: orders.map((order) => order.id)
        }
      },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.socket.findUnique({
      where: {
        guestId
      }
    })
  ])

  // Generate invoice PDF
  let invoice = null
  try {
    invoice = await generateInvoiceFromOrdersController(ordersResult, locale || 'vi')
  } catch (error) {
    console.error('Failed to generate invoice:', error)
    // Continue without invoice if generation fails
  }

  return {
    orders: ordersResult,
    socketId: sockerRecord?.socketId,
    invoice
  }
}

export const getOrderInvoiceController = async (orderId: number, locale: InvoiceLocale = 'vi') => {
  const selectedOrder = await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId
    },
    include: {
      dishSnapshot: true,
      guest: true
    }
  })

  if (selectedOrder.status !== OrderStatus.Paid) {
    throw new Error('Đơn hàng chưa thanh toán, không thể in hóa đơn')
  }

  if (!selectedOrder.guestId) {
    throw new Error('Không tìm thấy khách hàng của đơn hàng này')
  }

  const fromDate = new Date(selectedOrder.createdAt)
  fromDate.setHours(0, 0, 0, 0)
  const toDate = new Date(selectedOrder.createdAt)
  toDate.setHours(23, 59, 59, 999)

  const relatedPaidOrders = await prisma.order.findMany({
    where: {
      guestId: selectedOrder.guestId,
      status: OrderStatus.Paid,
      tableNumber: selectedOrder.tableNumber,
      createdAt: {
        gte: fromDate,
        lte: toDate
      }
    },
    include: {
      dishSnapshot: true,
      guest: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return await generateInvoiceFromOrdersController(relatedPaidOrders, locale)
}

export const getOrderDetailController = (orderId: number) => {
  return prisma.order.findUniqueOrThrow({
    where: {
      id: orderId
    },
    include: {
      dishSnapshot: true,
      orderHandler: true,
      guest: true,
      table: true
    }
  })
}

export const updateOrderController = async (
  orderId: number,
  body: UpdateOrderBodyType & { orderHandlerId: number }
) => {
  const { status, dishId, quantity, orderHandlerId } = body
  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: {
          id: orderId
        },
        include: {
          dishSnapshot: true
        }
      })
      let dishSnapshotId = order.dishSnapshotId
      if (order.dishSnapshot.dishId !== dishId) {
        const dish = await tx.dish.findUniqueOrThrow({
          where: {
            id: dishId
          }
        })
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
        dishSnapshotId = dishSnapshot.id
      }
      const newOrder = await tx.order.update({
        where: {
          id: orderId
        },
        data: {
          status,
          dishSnapshotId,
          quantity,
          orderHandlerId
        },
        include: {
          dishSnapshot: true,
          orderHandler: true,
          guest: true
        }
      })
      if (newOrder.tableNumber !== null) {
        await syncTableStatusByNumber(tx, newOrder.tableNumber)
      }
      return newOrder
    },
    {
      maxWait: 5000,
      timeout: 20000 // 🌟 Thêm timeout 20s cho luồng cập nhật trạng thái món
    }
  )
  const socketRecord = await prisma.socket.findUnique({
    where: {
      guestId: result.guestId!
    }
  })
  return {
    order: result,
    socketId: socketRecord?.socketId
  }
}

export const deleteOrderController = async (orderId: number) => {
  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: {
          id: orderId
        },
        include: {
          dishSnapshot: true,
          orderHandler: true,
          guest: true
        }
      })

      // Delete the order
      await tx.order.delete({
        where: {
          id: orderId
        }
      })

      // Update table status after deletion
      if (order.tableNumber !== null) {
        await syncTableStatusByNumber(tx, order.tableNumber)
      }

      return order
    },
    {
      maxWait: 5000,
      timeout: 20000
    }
  )

  let socketId: string | undefined = undefined
  if (result.guestId !== null) {
    const socketRecord = await prisma.socket.findUnique({
      where: {
        guestId: result.guestId
      }
    })
    socketId = socketRecord?.socketId
  }

  return {
    order: result,
    socketId
  }
}
