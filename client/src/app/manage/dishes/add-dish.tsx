"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getVietnameseDishStatus, handleErrorApi } from "@/lib/utils";
import {
  CreateDishBody,
  CreateDishBodyType,
} from "@/schemaValidations/dish.schema";
import { DishStatus, DishStatusValues } from "@/constants/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUploadImageMutation } from "@/queries/useMedia";
import { useAddDishMutation, useGetDishListQuery } from "@/queries/useDish";
import { toast } from "sonner";

export default function AddDish() {
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const addDishMutation = useAddDishMutation();
  const { data: dishListRes } = useGetDishListQuery();
  const dishList = dishListRes?.payload.data || [];
  const uploadImageMutation = useUploadImageMutation();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CreateDishBodyType>({
    resolver: zodResolver(CreateDishBody) as Resolver<CreateDishBodyType>,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image: "",
      status: DishStatus.Unavailable,
    },
  });

  const image = form.watch("image");
  const name = form.watch("name");

  const previewAvatarFromFile = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return image;
  }, [file, image]);

  const reset = () => {
    form.reset();
    setFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const onSubmit = async (values: CreateDishBodyType) => {
    if (addDishMutation.isPending || uploadImageMutation.isPending) return;
    try {
      // Kiểm tra tên món ăn trùng
      const isNameExist = dishList.some(
        (dish) => dish.name.toLowerCase() === values.name.toLowerCase()
      );
      if (isNameExist) {
        form.setError("name", {
          message: "Tên món ăn đã tồn tại",
        });
        return;
      }

      let body = { ...values };
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadImageResult = await uploadImageMutation.mutateAsync(formData);
        body.image = uploadImageResult.payload.data;
      }
      
      // Đảm bảo price là number (giống cách xử lý values trong AddEmployee)
      const result = await addDishMutation.mutateAsync({
        ...body,
        price: Number(body.price)
      });

      toast.success(result.payload.message || "Thêm món ăn thành công");
      reset();
      setOpen(false);
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Thêm món ăn</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle>Thêm món ăn mới</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            id="add-dish-form"
            onSubmit={form.handleSubmit(onSubmit, (e) => console.log(e))}
            onReset={reset}
          >
            <div className="grid gap-4 py-4">
              {/* Field: Image/Avatar */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-2 items-start justify-start">
                      <Avatar className="aspect-square w-[100px] h-[100px] rounded-md object-cover">
                        <AvatarImage src={previewAvatarFromFile} />
                        <AvatarFallback className="rounded-none">{name || "Ảnh"}</AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFile(file);
                            field.onChange("http://localhost:3000/" + file.name);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        className="flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed hover:bg-accent"
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Upload</span>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Field: Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="name">Tên món</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Input id="name" className="w-full" {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Field: Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="price">Giá (VNĐ)</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Input id="price" type="number" className="w-full" {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Field: Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="description">Mô tả</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Textarea id="description" className="w-full" {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Field: Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label>Trạng thái</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DishStatusValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getVietnameseDishStatus(status)}
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
          <Button 
            type="submit" 
            form="add-dish-form" 
            disabled={addDishMutation.isPending || uploadImageMutation.isPending}
          >
            {addDishMutation.isPending ? "Đang lưu..." : "Thêm món ăn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}