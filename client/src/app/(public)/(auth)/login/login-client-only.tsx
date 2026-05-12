"use client";

import { useEffect, useState } from "react";
import LoginForm from "@/app/(public)/(auth)/login/login-form";

export default function LoginClientOnly() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <LoginForm />;
}
