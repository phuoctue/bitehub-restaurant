"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleErrorApi } from "@/lib/utils";
import { useChangePasswordMutation } from "@/queries/useAccount";
import { ChangePasswordBody, ChangePasswordBodyType } from "@/schemaValidations/account.schema";

export default function ChangePasswordForm() {
  const t = useTranslations("ManageSetting");
  const changePasswordMutation = useChangePasswordMutation();

  const form = useForm<ChangePasswordBodyType>({
    resolver: zodResolver(ChangePasswordBody),
    defaultValues: {
      oldPassword: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: ChangePasswordBodyType) => {
    if (changePasswordMutation.isPending) return;
    try {
      const result = await changePasswordMutation.mutateAsync(data);
      toast.success(result.payload.message);
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Form {...form}>
      <form
        noValidate
        className="grid auto-rows-max items-start gap-4 md:gap-8"
        onSubmit={form.handleSubmit(onSubmit)}
        onReset={() => form.reset()}
      >
        <Card className="overflow-hidden" x-chunk="dashboard-07-chunk-4">
          <CardHeader>
            <CardTitle>{t("changePasswordTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-3">
                      <Label htmlFor="oldPassword">{t("oldPassword")}</Label>
                      <Input id="oldPassword" type="password" className="w-full" {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-3">
                      <Label htmlFor="password">{t("newPassword")}</Label>
                      <Input id="password" type="password" className="w-full" {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-3">
                      <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
                      <Input id="confirmPassword" type="password" className="w-full" {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-2 md:ml-auto">
                <Button variant="outline" size="sm" type="reset">
                  {t("cancel")}
                </Button>
                <Button size="sm" type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? t("saving") : t("save")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
