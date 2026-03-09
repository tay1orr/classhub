'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth-client'
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react'

export default function MemoriesWritePage() {
  const params = useParams()
  const router = useRouter()
  const classroom = params.classroom as string
  const user = getSession()

  const [form, setForm] = useState({ title: '', content: '', isAnonymous: false })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('이미지는 5MB 이하여야 합니다.'); return }
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setError('로그인이 필요합니다.'); return }
    if (!form.title.trim() || !form.content.trim()) { setError('제목과 내용을 입력해주세요.'); return }

    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          authorId: user.id,
          boardKey: 'MEMORIES',
          isAnonymous: form.isAnonymous,
          imageData: imagePreview,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/${classroom}/memories/${data.post.id}`)
      } else {
        setError(data.error || '작성에 실패했습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-gray-500">로그인이 필요합니다.</p>
      <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">로그인하기</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href={`/${classroom}/memories`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />우리반 추억으로 돌아가기
      </Link>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h1 className="text-xl font-bold mb-6">📸 추억 남기기</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="어떤 추억인가요?" maxLength={100}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사진 (선택)</label>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50 transition-colors overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-pink-400">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">클릭하여 사진 추가</p>
                  <p className="text-xs mt-1">5MB 이하</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
            {imagePreview && (
              <button type="button" onClick={() => setImagePreview(null)}
                className="mt-1 text-xs text-red-500 hover:underline">사진 제거</button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="그 날의 추억을 기록해보세요..." rows={6}
              className="w-full px-4 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} className="rounded" />
            <span className="text-sm text-gray-700">익명으로 작성</span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Link href={`/${classroom}/memories`} className="px-5 py-2.5 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50">
              취소
            </Link>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors">
              <Send className="h-4 w-4" />
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
