'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { getTableLink, getVietnameseTableStatus, handleErrorApi } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UpdateTableBody, UpdateTableBodyType } from '@/schemaValidations/table.schema'
import { TableStatus, TableStatusValues } from '@/constants/type'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { usegetTableQuery, useUpdateTableMutation } from '@/queries/useTable'
import { toast } from 'sonner'
import QRCodeCanvas from '@/components/qrcode-table'

export default function EditTable({
  id,
  setId,
  onSubmitSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSubmitSuccess?: () => void
}) {
  // 1. Hooks từ React Query
  const updateTableMutation = useUpdateTableMutation()
  // Sử dụng tên hook đúng với khai báo trong dự án (chữ 'g' thường)
  const { data } = usegetTableQuery(id as number)

  // 2. Cấu hình Form (Zod + React Hook Form)
  const form = useForm<UpdateTableBodyType>({
    resolver: zodResolver(UpdateTableBody) as any,
    defaultValues: {
      capacity: 2,
      status: TableStatus.Hidden,
      changeToken: false
    }
  })

  // 3. Cập nhật dữ liệu vào form khi API trả về thông tin bàn
  useEffect(() => {
    if (data) {
      const { capacity, status } = data.payload.data
      form.reset({
        capacity,
        status,
        changeToken: false // Luôn để false khi mở modal mới để tránh vô tình đổi token
      })
    }
  }, [data, form])

  // 4. Hàm Reset và đóng modal
  const reset = () => {
    setId(undefined)
    form.reset()
  }

  // 5. Xử lý lưu dữ liệu
  const onSubmit = async (values: UpdateTableBodyType) => {
    if (updateTableMutation.isPending || !id) return
    try {
      const result = await updateTableMutation.mutateAsync({
        id: id as number,
        body: values
      })
      toast.success(result.payload.message)
      onSubmitSuccess?.() // Gọi callback để load lại danh sách ở trang cha
      reset()
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError
      })
    }
  }

  const tableData = data?.payload.data

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) reset()
      }}
    >
      <DialogContent className='sm:max-w-[600px] max-h-screen overflow-auto'>
        <DialogHeader>
          <DialogTitle>Cập nhật bàn ăn</DialogTitle>
          <DialogDescription>Thay đổi thông tin sức chứa hoặc trạng thái bàn.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-table-form'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className='grid gap-4 py-4'>
              {/* Số hiệu bàn - Read Only */}
              <FormItem>
                <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                  <Label htmlFor='number'>Số hiệu bàn</Label>
                  <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                    <Input id='number' type='number' className='w-full' value={tableData?.number ?? 0} readOnly />
                  </div>
                </div>
              </FormItem>

              {/* Sức chứa */}
              <FormField
                control={form.control}
                name='capacity'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='capacity'>Sức chứa (người)</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Input
                          id='capacity'
                          className='w-full'
                          type='number'
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Trạng thái */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label>Trạng thái</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Chọn trạng thái' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TableStatusValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getVietnameseTableStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Đổi QR Code Switch */}
              <FormField
                control={form.control}
                name='changeToken'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='changeToken'>Đổi QR Code</Label>
                      <div className='col-span-1 sm:col-span-3 w-full'>
                        <div className='flex items-center space-x-2'>
                          <Switch id='changeToken' checked={field.value} onCheckedChange={field.onChange} />
                          <Label htmlFor='changeToken' className='font-normal text-muted-foreground italic text-xs'>
                            Làm mới mã định danh (Khách cũ dùng mã cũ sẽ không truy cập được)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Hiển thị QR Code & URL khi có dữ liệu bàn */}
              {tableData && (
                <>
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label>QR Code</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <QRCodeCanvas 
                          token={tableData.token} 
                          tableNumber={tableData.number}
                        />
                      </div>
                    </div>
                  </FormItem>
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label>URL gọi món</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Link
                          href={getTableLink({
                            token: tableData.token,
                            tableNumber: tableData.number
                          })}
                          target='_blank'
                          className='break-all text-blue-500 underline text-sm'
                        >
                          {getTableLink({
                            token: tableData.token,
                            tableNumber: tableData.number
                          })}
                        </Link>
                      </div>
                    </div>
                  </FormItem>
                </>
              )}
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='edit-table-form' disabled={updateTableMutation.isPending}>
            {updateTableMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}