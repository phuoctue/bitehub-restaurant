import LoginClientOnly from "@/app/(public)/(auth)/login/login-client-only";

export default function Login() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center px-4">
      <LoginClientOnly />
    </div>
  );
}

