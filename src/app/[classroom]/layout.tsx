import { redirect } from 'next/navigation'
import { CLASS_CONFIG } from '@/lib/config'
import { getServerSession } from '@/lib/auth-server'

export default async function ClassroomLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { classroom: string }
}) {
  if (params.classroom !== CLASS_CONFIG.slug) {
    redirect(`/${CLASS_CONFIG.slug}`)
  }

  const user = await getServerSession()
  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
