"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleErrorApi } from "@/lib/utils";
import { useAccountMe, useUpdateMeMutation } from "@/queries/useAccount";
import { useUploadImageMutation } from "@/queries/useMedia";
import { UpdateMeBody, UpdateMeBodyType } from "@/schemaValidations/account.schema";

export default function UpdateProfileForm() {
  const t = useTranslations("ManageSetting");
  const [file, setFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data, refetch } = useAccountMe();
  const updateMeMutation = useUpdateMeMutation();
  const uploadImageMutation = useUploadImageMutation();

  const form = useForm<UpdateMeBodyType>({
    resolver: zodResolver(UpdateMeBody),
    defaultValues: { name: "", avatar: "" }
  });

  const avatar = form.watch("avatar");
  const previewAvatar = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return avatar || undefined;
  }, [file, avatar]);

  useEffect(() => {
    return () => {
      if (previewAvatar && previewAvatar.startsWith("blob:")) {
        URL.revokeObjectURL(previewAvatar);
      }
    };
  }, [previewAvatar]);

  useEffect(() => {
    if (!data) return;
    const { name, avatar } = data.payload.data;
    form.reset({ name, avatar: avatar ?? "" });
  }, [data, form]);

  const onSubmit = async (values: UpdateMeBodyType) => {
    if (updateMeMutation.isPending) return;
    try {
      let body = values;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadImageResult = await uploadImageMutation.mutateAsync(formData);
        body = { ...values, avatar: uploadImageResult.payload.data };
      }
      const result = await updateMeMutation.mutateAsync(body);
      toast.success(result.payload.message);
      refetch();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Form {...form}>
      <form
        noValidate
        className="grid auto-rows-max items-start gap-4 md:gap-8"
        onReset={() => {
          form.reset();
          setFile(null);
        }}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("profileTitle")}</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start justify-start gap-2">
                      <Avatar className="aspect-square h-[100px] w-[100px] rounded-md">
                        <AvatarImage src={previewAvatar} className="object-cover" />
                        <AvatarFallback className="rounded-none">
                          {form.getValues("name")?.slice(0, 2).toUpperCase() || "AV"}
                        </AvatarFallback>
                      </Avatar>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={avatarInputRef}
                        onChange={(e) => {
                          const selected = e.target.files?.[0];
                          if (selected) {
                            setFile(selected);
                            field.onChange(URL.createObjectURL(selected));
                          }
                        }}
                      />

                      <button
                        className="flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed"
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">{t("upload")}</span>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-3">
                      <Label htmlFor="name">{t("name")}</Label>
                      <Input id="name" type="text" className="w-full" {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 md:ml-auto">
                <Button variant="outline" size="sm" type="reset">
                  {t("cancel")}
                </Button>
                <Button size="sm" type="submit" disabled={updateMeMutation.isPending || uploadImageMutation.isPending}>
                  {updateMeMutation.isPending ? t("saving") : t("saveProfile")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
