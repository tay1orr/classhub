import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import { CLASS_CONFIG } from '@/lib/config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `우리반 - ${CLASS_CONFIG.displayName} 전용 공간`,
  description: `${CLASS_CONFIG.displayName}만의 특별한 소통 공간`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-6 max-w-6xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
