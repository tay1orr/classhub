'use client'

import { useEffect } from 'react'
import { getCurrentUser, isAdmin } from '@/lib/simple-auth'

export default function NavigationScript() {
  useEffect(() => {
    const updateNavigation = () => {
      const currentUser = getCurrentUser()
      const navSection = document.getElementById('nav-user-section')
      if (!navSection) return

      if (currentUser) {
        const adminButton = isAdmin(currentUser) ? `
          <a 
            href="/admin" 
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors ml-4"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            관리자 패널
          </a>
        ` : ''
        
        navSection.innerHTML = `
          <div class="flex items-center space-x-4">
            <span class="text-lg font-medium text-gray-700">
              ${currentUser.name}님 환영합니다! 👋
            </span>
            <button 
              onclick="logout()" 
              class="text-lg font-medium text-gray-600 hover:text-blue-600 cursor-pointer"
            >
              로그아웃
            </button>
            ${adminButton}
          </div>
        `
      } else {
        navSection.innerHTML = `
          <a href="/login" class="text-gray-600 hover:text-blue-600 font-medium">
            로그인
          </a>
          <a href="/signup" class="text-gray-600 hover:text-blue-600 font-medium ml-6">
            회원가입
          </a>
        `
      }
    }

    // 전역 로그아웃 함수
    const logout = () => {
      localStorage.removeItem('classhub_current_user')
      alert('로그아웃되었습니다!')
      window.location.href = '/'
    }

    // 전역 함수 등록
    ;(window as any).logout = logout

    // 초기 로드
    updateNavigation()

    // 이벤트 리스너
    const handleStorageChange = () => updateNavigation()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userStatusChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userStatusChanged', handleStorageChange)
    }
  }, [])

  return null
}