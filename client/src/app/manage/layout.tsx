'use client'
import DarkModeToggle from '@/components/dark-mode-toggle'
import LanguageSwitcher from '@/components/language-switcher'
import DropdownAvatar from '@/app/manage/dropdown-avatar'
import NavLinks from '@/app/manage/nav-links'
import MobileNavLinks from '@/app/manage/mobile-nav-links'
import { useAppStore } from '@/components/app-provider'
import { withLocalePath } from '@/lib/locale-path'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const  isAuth = useAppStore(state => state.isAuth);
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Nếu không có isAuth thì redirect về login
    // Tuy nhiên isAuth có thể false lúc đầu do useEffect chưa kịp chạy
    // Nên ta cần check thêm accessToken trong localStorage cho chắc chắn
    const accessToken = localStorage.getItem('accessToken')
    const refreshTokenInCookie = document.cookie
      .split("; ")
      .some((item) => item.startsWith("refreshToken="));
    if (!accessToken && !isAuth && !refreshTokenInCookie) {
      router.push(withLocalePath('/login', pathname))
    }
  }, [isAuth, pathname, router])

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <NavLinks />
      <div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-14'>
        <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'>
          <MobileNavLinks />
          <div className='relative ml-auto flex-1 md:grow-0'>
            <div className='flex justify-end gap-2'>
              <LanguageSwitcher />
              <DarkModeToggle />
            </div>
          </div>
          <DropdownAvatar />
        </header>
        {children}
      </div>
    </div>
  )
}
