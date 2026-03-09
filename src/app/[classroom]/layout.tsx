'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CLASS_CONFIG } from '@/lib/config'
import { getSession } from '@/lib/auth-client'

export default function ClassroomLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    // 잘못된 classroom slug → 올바른 경로로 리다이렉트
    if (params.classroom !== CLASS_CONFIG.slug) {
      router.replace(`/${CLASS_CONFIG.slug}`)
      return
    }

    // 미로그인 → 로그인 페이지로
    const user = getSession()
    if (!user) {
      router.replace('/login')
    }
  }, [params.classroom, router])

  if (params.classroom !== CLASS_CONFIG.slug) return null

  return <>{children}</>
}
