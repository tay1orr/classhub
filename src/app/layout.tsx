import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NavigationScript from '@/components/navigation-script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '우리반 - 1학년 8반 전용 공간',
  description: '1학년 8반만의 특별한 소통 공간',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <nav className="border-b bg-background/95 backdrop-blur shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex h-20 items-center justify-between">
                <div className="flex items-center space-x-8">
                  <a href="/1-8" className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors">우리반</a>
                  <div className="hidden md:flex space-x-6">
                    <a href="/1-8" className="text-lg font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-blue-50 transition-all">
                      🏠 홈
                    </a>
                    <a href="/1-8/free" className="text-lg font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-blue-50 transition-all">
                      💬 자유게시판
                    </a>
                    <a href="/1-8/assignment" className="text-lg font-medium text-gray-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50 transition-all">
                      📝 수행평가
                    </a>
                    <a href="/1-8/exam" className="text-lg font-medium text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md hover:bg-purple-50 transition-all">
                      📚 지필평가
                    </a>
                    <a href="/1-8/memories" className="text-lg font-medium text-gray-700 hover:text-pink-600 px-3 py-2 rounded-md hover:bg-pink-50 transition-all">
                      📸 우리반 추억
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div id="nav-user-section" className="text-lg">
                    <a href="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                      로그인
                    </a>
                    <a href="/signup" className="text-gray-600 hover:text-blue-600 font-medium ml-6">
                      회원가입
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
        <NavigationScript />
      </body>
    </html>
  )
}