"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Role, RoleValues } from "@/constants/type";
import { handleErrorApi } from "@/lib/utils";
import { useGetAccount, useUpdateAccountMutation } from "@/queries/useAccount";
import { useUploadImageMutation } from "@/queries/useMedia";
import { UpdateEmployeeAccountBody, UpdateEmployeeAccountBodyType } from "@/schemaValidations/account.schema";

export default function EditEmployee({
  id,
  setId,
  onSubmitSuccess,
}: {
  id?: number;
  setId: (value: number | undefined) => void;
  onSubmitSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const { data } = useGetAccount({
    id: id as number,
    enabled: Boolean(id),
  });

  const updateAccountMutation = useUpdateAccountMutation();
  const uploadImageMutation = useUploadImageMutation();

  const form = useForm<UpdateEmployeeAccountBodyType>({
    resolver: zodResolver(UpdateEmployeeAccountBody) as any,
    defaultValues: {
      name: "",
      email: "",
      avatar: "",
      password: "",
      confirmPassword: "",
      changePassword: false,
      role: Role.Employee,
    },
  });

  const avatar = form.watch("avatar");
  const name = form.watch("name");
  const changePassword = form.watch("changePassword");

  const previewAvatarFromFile = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return avatar || "";
  }, [file, avatar]);

  useEffect(() => {
    if (!data) return;
    const account = data.payload.data;
    form.reset({
      name: account.name,
      email: account.email,
      avatar: account.avatar ?? "",
      changePassword: form.getValues("changePassword"),
      password: form.getValues("password") ?? "",
      confirmPassword: form.getValues("confirmPassword") ?? "",
      role: account.role === Role.Owner ? Role.Owner : Role.Employee,
    });
  }, [data, form]);

  const onSubmit = async (values: UpdateEmployeeAccountBodyType) => {
    if (updateAccountMutation.isPending) return;
    try {
      let body: UpdateEmployeeAccountBodyType & { id: number } = {
        id: id as number,
        ...values,
      };

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadImageResult = await uploadImageMutation.mutateAsync(formData);
        body.avatar = uploadImageResult.payload.data;
      }

      const result = await updateAccountMutation.mutateAsync(body);
      toast.success(result.payload.message);
      reset();
      onSubmitSuccess?.();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const reset = () => {
    setId(undefined);
    setFile(null);
  };

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) reset();
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle>Update account</DialogTitle>
          <DialogDescription>Name and email are required fields</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            noValidate
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            id="edit-employee-form"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-2 items-start justify-start">
                      <Avatar className="aspect-square w-[100px] h-[100px] rounded-md object-cover">
                        <AvatarImage src={previewAvatarFromFile} />
                        <AvatarFallback className="rounded-none">{name || "Avatar"}</AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        ref={avatarInputRef}
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0];
                          if (selectedFile) {
                            setFile(selectedFile);
                            field.onChange("");
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        className="flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed"
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Upload</span>
                      </button>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="name">Name</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Input id="name" className="w-full" {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="email">Email</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Input id="email" className="w-full" {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label>Role</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RoleValues.filter((role) => role !== Role.Guest).map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
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

              <FormField
                control={form.control}
                name="changePassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="changePassword">Change password</Label>
                      <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                        <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {changePassword && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                        <Label htmlFor="password">New password</Label>
                        <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                          <Input id="password" className="w-full" type="password" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {changePassword && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-center justify-items-start gap-4">
                        <Label htmlFor="confirmPassword">Confirm new password</Label>
                        <div className="col-span-1 sm:col-span-3 w-full space-y-2">
                          <Input id="confirmPassword" className="w-full" type="password" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </form>
        </Form>

        <DialogFooter>
          <Button type="submit" form="edit-employee-form">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
