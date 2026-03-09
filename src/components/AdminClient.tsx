'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle, Trash2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  isApproved: boolean
  createdAt: string
}

export default function AdminClient({ initialUsers, meId }: { initialUsers: User[]; meId: string }) {
  const [users, setUsers] = useState(initialUsers)
  const [tab, setTab] = useState<'pending' | 'all'>('pending')

  const refetch = async () => {
    const res = await fetch('/api/admin/users', { cache: 'no-store' })
    const data = await res.json()
    setUsers(data.users || [])
  }

  const handleApprove = async (userId: string) => {
    await fetch(`/api/admin/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: meId }),
    })
    refetch()
  }

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`${name} 계정을 삭제하시겠습니까?`)) return
    await fetch(`/api/admin/users/${userId}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: meId }),
    })
    refetch()
  }

  const pending = users.filter((u) => !u.isApproved)
  const displayed = tab === 'pending' ? pending : users

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 회원', value: users.length, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: '승인 대기', value: pending.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: '승인 완료', value: users.filter((u) => u.isApproved).length, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl border p-4 text-center`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex border-b">
          {[
            { key: 'pending', label: `승인 대기 (${pending.length})` },
            { key: 'all', label: `전체 회원 (${users.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as 'pending' | 'all')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="divide-y">
          {displayed.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {tab === 'pending' ? '✅ 승인 대기 중인 회원이 없습니다' : '회원이 없습니다'}
            </div>
          ) : displayed.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">{user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-600' :
                    user.isApproved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {user.role === 'ADMIN' ? '관리자' : user.isApproved ? '승인됨' : '대기중'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                <p className="text-xs text-gray-400">가입: {formatDateTime(user.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!user.isApproved && (
                  <button onClick={() => handleApprove(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-md hover:bg-green-600">
                    <CheckCircle className="h-3.5 w-3.5" /> 승인
                  </button>
                )}
                {user.id !== meId && (
                  <button onClick={() => handleDelete(user.id, user.name)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> 삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
