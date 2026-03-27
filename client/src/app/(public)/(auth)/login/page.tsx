import LoginForm from '@/app/(public)/(auth)/login/login-form'
import { Suspense } from 'react'

export default function Login() {
  return (
    <div className='min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center px-4'>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}

