import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { CLASS_CONFIG } from '@/lib/config'
import AdminClient from '@/components/AdminClient'

async function fetchUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
    orderBy: [{ isApproved: 'asc' }, { createdAt: 'desc' }],
  })
  return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))
}

export default async function AdminPage() {
  const me = await getServerSession()
  if (!me || me.role !== 'ADMIN') redirect(`/${CLASS_CONFIG.slug}`)

  const users = await fetchUsers()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
        <Shield className="h-6 w-6 text-red-600" />
        <div>
          <h1 className="text-xl font-bold text-red-700">관리자 패널</h1>
          <p className="text-sm text-red-500">{CLASS_CONFIG.displayName} · {me.name}</p>
        </div>
      </div>
      <AdminClient initialUsers={users} meId={me.id} />
    </div>
  )
}
