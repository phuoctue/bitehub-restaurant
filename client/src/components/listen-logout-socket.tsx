// src/components/listen-logout-socket.tsx
"use client"
import { useAppContext } from '@/components/app-provider'
import { handleErrorApi } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const UNAUTHENTICATED_PATH = ['/login', '/logout', '/refresh-token']

export default function ListenLogoutSocket() {
  const pathname = usePathname()
  const router = useRouter()
  const { mutateAsync } = useLogoutMutation()
  const { setRole, socket, disconnectSocket } = useAppContext()

  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return

    async function onLogout() {
      // Ưu tiên xử lý Local trước để "văng" ngay lập tức
      try {
        setRole() // Hàm này của Trí đã bao gồm xóa tokens
        disconnectSocket()
        router.push('/')
        
        // Sau đó mới gọi API để xóa session trên server (nếu account chưa bị xóa hẳn)
        await mutateAsync()
      } catch (error: any) {
        // Nếu account đã bị xóa từ DB, API logout sẽ lỗi 401, ta chỉ cần log lại
        console.log('Account already deleted from server, local session cleared.')
      }
    }

    socket?.on('logout', onLogout)

    return () => {
      socket?.off('logout', onLogout)
    }
  }, [socket, pathname, setRole, router, mutateAsync, disconnectSocket])

  return null
}