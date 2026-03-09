'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSession, isAdmin } from '@/lib/auth-client'
import { ArrowLeft, Send } from 'lucide-react'

interface WritePostProps {
  boardKey: string
  title: string
  color: string
  emoji: string
  backHref?: string
}

export default function WritePost({ boardKey, title, color, emoji, backHref }: WritePostProps) {
  const params = useParams()
  const router = useRouter()
  const user = getSession()
  const classroom = params.classroom as string

  const [form, setForm] = useState({ title: '', content: '', isAnonymous: false, isPinned: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const back = backHref || `/${classroom}/${boardKey.toLowerCase()}`

  const colorBtnMap: Record<string, string> = {
    blue:   'bg-blue-600 hover:bg-blue-700',
    green:  'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    pink:   'bg-pink-600 hover:bg-pink-700',
  }
  const btnClass = colorBtnMap[color] || colorBtnMap.blue

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setError('로그인이 필요합니다.'); return }
    if (!form.title.trim() || !form.content.trim()) { setError('제목과 내용을 모두 입력해주세요.'); return }

    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          boardKey,
          isAnonymous: form.isAnonymous,
          isPinned: form.isPinned,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/${classroom}/${boardKey.toLowerCase()}/${data.post.id}`)
      } else {
        setError(data.error || '게시글 작성에 실패했습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500">로그인이 필요합니다.</p>
        <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">로그인하기</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href={back} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {title}으로 돌아가기
      </Link>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h1 className="text-xl font-bold mb-6">{emoji} 새 글 작성</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/100</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="내용을 입력하세요..."
              rows={10}
              className="w-full px-4 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">익명으로 작성</span>
            </label>
            {isAdmin(user) && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500"
                />
                <span className="text-sm text-gray-700">📌 공지사항으로 등록</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Link href={back} className="px-5 py-2.5 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors">
              취소
            </Link>
            <button type="submit" disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${btnClass}`}>
              <Send className="h-4 w-4" />
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
