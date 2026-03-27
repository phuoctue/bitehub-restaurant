"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { LoginBody, LoginBodyType } from "@/schemaValidations/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { useLoginMutation } from "@/queries/useAuth";
import { toast } from "sonner";
import { handleErrorApi } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAppContext } from "@/components/app-provider";

export default function LoginForm() {
  const loginMutation = useLoginMutation();
  const searchParams = useSearchParams();
  const clearTokens = searchParams.get("clearTokens");
  const { setIsAuth } = useAppContext();

  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBody),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();
  useEffect(() => {
    if (clearTokens) {
      setIsAuth(false);
    }
  }, [clearTokens, setIsAuth]);

  const onSubmit = async (data: LoginBodyType) => {
    //khi nhấn submit thì React hook form sẽ validate cái form bằng zod schema ở client trươc1
    //nếu không pass qua vòng này thì sẽ không gọi API
    if (loginMutation.isPending) return;
    try {
      const result = await loginMutation.mutateAsync(data);
      toast.success(result.payload.message);
      setIsAuth(true);
      router.push("/manage/dashboard");
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  return (
    <Card className="mx-auto w-full max-w-[350px] sm:max-w-[400px] md:max-w-[450px] shadow-lg border-muted-foreground/20">
      <CardHeader className="space-y-2 p-6 sm:p-8">
        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          Nhập email của bạn để truy cập vào hệ thống
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 pt-0 sm:pt-0">
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10"
                        required
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <a
                      href="#"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-10"
                        required
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-semibold py-6">
              Đăng nhập
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-6"
              type="button"
            >
              <svg
                className="h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Google
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
