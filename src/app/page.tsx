import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth-server'
import { CLASS_CONFIG } from '@/lib/config'

export default async function RootPage() {
  const user = await getServerSession()
  if (user) redirect(`/${CLASS_CONFIG.slug}`)

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-6">🏫</div>
        <h1 className="text-4xl font-bold text-blue-600 mb-3">{CLASS_CONFIG.displayName}</h1>
        <p className="text-gray-500 mb-8">우리만의 특별한 소통 공간에 오신 것을 환영합니다</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="px-8 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="px-8 py-3 text-sm font-semibold text-gray-700 border rounded-xl hover:bg-gray-50 transition-colors">
            회원가입
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 text-left">
          {[
            { emoji: '💬', title: '자유게시판', desc: '친구들과 자유롭게 소통' },
            { emoji: '📝', title: '수행/지필평가', desc: '평가 정보와 자료 공유' },
            { emoji: '💡', title: '건의사항', desc: '선생님께 의견 전달' },
            { emoji: '📸', title: '우리반 추억', desc: '소중한 순간들을 함께' },
          ].map((item) => (
            <div key={item.title} className="p-4 bg-white rounded-xl border">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
