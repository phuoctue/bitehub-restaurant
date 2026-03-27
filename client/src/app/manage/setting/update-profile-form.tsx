'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { UpdateMeBody, UpdateMeBodyType } from '@/schemaValidations/account.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccountMe, useUpdateMeMutation } from '@/queries/useAccount'
import { useUploadImageMutation } from '@/queries/useMedia'
import { toast } from 'sonner'
import { handleErrorApi } from '@/lib/utils'

export default function UpdateProfileForm() {
  const [file, setFile] = useState<File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { data, refetch } = useAccountMe()
  const updateMeMutation = useUpdateMeMutation()
  const uploadImageMutation = useUploadImageMutation()

  const form = useForm<UpdateMeBodyType>({
    resolver: zodResolver(UpdateMeBody),
    defaultValues: {
      name: '',
      avatar: '' 
    }
  })

  // Theo dõi giá trị avatar trong form
  const avatar = form.watch('avatar')

  // Fix Bài 44: Xử lý Preview ảnh an toàn
  const previewAvatar = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }
    // Nếu không có file mới, dùng avatar từ server hoặc ảnh mặc định
    return avatar || '/default-avatar.png' 
  }, [file, avatar])

  // Fix Bài 44: Thu hồi URL tạm để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (previewAvatar && previewAvatar.startsWith('blob:')) {
        URL.revokeObjectURL(previewAvatar)
      }
    }
  }, [previewAvatar])

  useEffect(() => {
    if (data) {
      const { name, avatar } = data.payload.data
      form.reset({
        name,
        avatar: avatar ?? ''
      })
    }
  }, [data, form])

  const reset = () => {
    form.reset()
    setFile(null)
  }

  const onSubmit = async (values: UpdateMeBodyType) => {
    if (updateMeMutation.isPending) return

    try {
      let body = values
      // Nếu có chọn file mới thì upload lên server trước
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadImageResult = await uploadImageMutation.mutateAsync(formData)
        const imageUrl = uploadImageResult.payload.data

        body = {
          ...values,
          avatar: imageUrl
        }
      }

      const result = await updateMeMutation.mutateAsync(body)
      toast.success(result.payload.message)
      refetch() // Tải lại dữ liệu để đồng bộ với Header (DropdownAvatar)
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError
      })
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        className='grid auto-rows-max items-start gap-4 md:gap-8'
        onReset={reset}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>

          <CardContent>
            <div className='grid gap-6'>
              <FormField
                control={form.control}
                name='avatar'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex gap-2 items-start justify-start'>
                      <Avatar className='aspect-square w-[100px] h-[100px] rounded-md'>
                        <AvatarImage src={previewAvatar} className='object-cover' />
                        <AvatarFallback className='rounded-none'>
                          {form.getValues('name')?.slice(0, 2).toUpperCase() || 'AV'}
                        </AvatarFallback>
                      </Avatar>

                      <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        ref={avatarInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFile(file)
                            // Chỉ cần gọi field.onChange để báo cho react-hook-form là có thay đổi
                            field.onChange(URL.createObjectURL(file)) 
                          }
                        }}
                      />

                      <button
                        className='flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed'
                        type='button'
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className='h-4 w-4 text-muted-foreground' />
                        <span className='sr-only'>Upload</span>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-3'>
                      <Label htmlFor='name'>Tên</Label>
                      <Input id='name' type='text' className='w-full' {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className='items-center gap-2 md:ml-auto flex'>
                <Button variant='outline' size='sm' type='reset'>
                  Hủy
                </Button>
                <Button size='sm' type='submit' disabled={updateMeMutation.isPending || uploadImageMutation.isPending}>
                  {updateMeMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}