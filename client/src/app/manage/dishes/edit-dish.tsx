'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { handleErrorApi } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UpdateDishBody, UpdateDishBodyType } from '@/schemaValidations/dish.schema'
import { DishStatus, DishStatusValues } from '@/constants/type'
import { Textarea } from '@/components/ui/textarea'
import { useUploadImageMutation } from '@/queries/useMedia'
import { useGetDishListQuery, useGetDishQuery, useUpdateDishMutation } from '@/queries/useDish'
import { toast } from 'sonner'

export default function EditDish({
  id,
  setId,
  onSubmitSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSubmitSuccess?: () => void
}) {
  const t = useTranslations('ManageDishes')
  const [file, setFile] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const uploadImageMutation = useUploadImageMutation()
  const updateDishMutation = useUpdateDishMutation()
  const { data: dishListRes } = useGetDishListQuery()
  const dishList = dishListRes?.payload.data || []
  const { data } = useGetDishQuery(id as number)

  const form = useForm<UpdateDishBodyType>({
    resolver: zodResolver(UpdateDishBody) as any,
    defaultValues: {
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      price: 0,
      image: '',
      status: DishStatus.Unavailable
    }
  })

  const image = form.watch('image')
  const name = form.watch('name')

  const previewAvatarFromFile = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    return image
  }, [file, image])

  useEffect(() => {
    if (data) {
      const { name, nameEn, image, description, descriptionEn, price, status } = data.payload.data
      form.reset({
        name,
        nameEn: nameEn ?? '',
        description,
        descriptionEn: descriptionEn ?? '',
        price,
        status,
        image: image ?? ''
      })
    }
  }, [data, form])

  const onSubmit = async (values: UpdateDishBodyType) => {
    if (updateDishMutation.isPending) return
    try {
      const isNameExist = dishList.some(
        (dish) => dish.name.toLowerCase() === values.name.toLowerCase() && dish.id !== id
      )
      if (isNameExist) {
        form.setError('name', {
          message: t('dishNameExists')
        })
        return
      }

      const bodyValues = { ...values }
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadImageResult = await uploadImageMutation.mutateAsync(formData)
        bodyValues.image = uploadImageResult.payload.data
      }

      const result = await updateDishMutation.mutateAsync({
        id: id as number,
        body: bodyValues
      })

      toast.success(result.payload.message)
      reset()
      onSubmitSuccess?.()
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError
      })
    }
  }

  const reset = () => {
    setId(undefined)
    setFile(null)
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) reset()
      }}
    >
      <DialogContent className='sm:max-w-[600px] max-h-screen overflow-auto'>
        <DialogHeader>
          <DialogTitle>{t('editDish')}</DialogTitle>
          <DialogDescription>{t('requiredFields')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form noValidate className='grid auto-rows-max items-start gap-4 md:gap-8' id='edit-dish-form' onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='image'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex gap-2 items-start justify-start'>
                      <Avatar className='aspect-square w-[100px] h-[100px] rounded-md object-cover'>
                        <AvatarImage src={previewAvatarFromFile} />
                        <AvatarFallback className='rounded-none'>{name || t('image')}</AvatarFallback>
                      </Avatar>
                      <input
                        type='file'
                        accept='image/*'
                        ref={imageInputRef}
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0]
                          if (selectedFile) {
                            setFile(selectedFile)
                            field.onChange('')
                          }
                        }}
                        className='hidden'
                      />
                      <button
                        className='flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed'
                        type='button'
                        onClick={() => imageInputRef.current?.click()}
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
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>{t('dishName')}</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='price'>{t('priceVnd')}</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Input
                          id='price'
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

              <FormField
                control={form.control}
                name='nameEn'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='nameEn'>Dish Name (EN)</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Input id='nameEn' className='w-full' {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='description'>{t('description')}</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Textarea id='description' className='w-full' {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='descriptionEn'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='descriptionEn'>Description (EN)</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Textarea id='descriptionEn' className='w-full' {...field} value={field.value ?? ''} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4'>
                      <Label>{t('statusLabel')}</Label>
                      <div className='col-span-1 sm:col-span-3 w-full space-y-2'>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('chooseStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DishStatusValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {t(`status.${status}`)}
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
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='edit-dish-form'>
            {updateDishMutation.isPending ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
