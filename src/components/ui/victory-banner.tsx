'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Star, ChevronDown, ChevronUp, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function VictoryBanner() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    try {
      const bannerState = localStorage.getItem('victory_banner_state')
      if (bannerState) {
        const state = JSON.parse(bannerState)
        setIsExpanded(state.expanded ?? true)
        setIsVisible(state.visible ?? true)
      }
    } catch (error) {
      console.error('Error loading banner state:', error)
    }
  }, [])

  const toggleBanner = () => {
    console.log('Toggle banner clicked')
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    try {
      localStorage.setItem('victory_banner_state', JSON.stringify({
        expanded: newExpanded,
        visible: isVisible
      }))
    } catch (error) {
      console.error('Error saving banner state:', error)
    }
  }

  const closeBanner = () => {
    console.log('Close banner clicked')
    setIsVisible(false)
    try {
      localStorage.setItem('victory_banner_state', JSON.stringify({
        expanded: isExpanded,
        visible: false
      }))
    } catch (error) {
      console.error('Error saving banner state:', error)
    }
  }

  if (!isVisible) return null

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg mb-6 border-2 border-yellow-300">
      {!isExpanded ? (
        // 접힌 상태
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-white" />
            <span className="text-white font-bold">🎉 1학년 8반 체육대회 우승! 🎉</span>
            <Medal className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBanner}
              className="text-white hover:bg-white/20 p-1"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeBanner}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // 펼친 상태
        <>
          {/* 배경 이미지 */}
          <div className="relative h-64 w-full">
            <Image
              src="/images/sports_day.jpg"
              alt="1학년 8반 체육대회 우승"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"></div>
          </div>
          
          {/* 컨트롤 버튼들 */}
          <div className="absolute top-4 right-4 flex gap-2 z-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBanner}
              className="bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm border border-white/20 relative z-10"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeBanner}
              className="bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm border border-white/20 relative z-10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 텍스트 오버레이 */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
            <div className="flex justify-center items-center gap-4 mb-4">
              <Trophy className="h-12 w-12 text-yellow-300 animate-bounce drop-shadow-lg" />
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">🎉 체육대회 우승! 🎉</h1>
                <p className="text-2xl font-semibold drop-shadow-lg">1학년 8반 대승리!</p>
              </div>
              <Medal className="h-12 w-12 text-yellow-300 animate-bounce drop-shadow-lg" style={{animationDelay: '0.2s'}} />
            </div>
            
            <div className="flex justify-center items-center gap-6 text-white text-lg mb-4">
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                <Star className="h-6 w-6 text-yellow-300" />
                <span className="font-medium drop-shadow-lg">종합 1위</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                <Star className="h-6 w-6 text-yellow-300" />
                <span className="font-medium drop-shadow-lg">단체 최우수</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                <Star className="h-6 w-6 text-yellow-300" />
                <span className="font-medium drop-shadow-lg">단합력 최고</span>
              </div>
            </div>

            <div className="text-yellow-100 text-lg drop-shadow-lg bg-black/20 px-4 py-2 rounded-lg">
              모든 학생들의 열정과 노력이 만들어낸 값진 승리입니다! 👏
            </div>

            {/* 장식용 별들 */}
            <div className="absolute top-16 left-6 text-yellow-300 text-3xl animate-pulse drop-shadow-lg">⭐</div>
            <div className="absolute top-20 right-20 text-yellow-300 text-2xl animate-pulse drop-shadow-lg" style={{animationDelay: '0.5s'}}>✨</div>
            <div className="absolute bottom-4 left-8 text-yellow-300 text-2xl animate-pulse drop-shadow-lg" style={{animationDelay: '1s'}}>🌟</div>
            <div className="absolute bottom-6 right-20 text-yellow-300 text-3xl animate-pulse drop-shadow-lg" style={{animationDelay: '0.7s'}}>⭐</div>
          </div>
        </>
      )}
    </div>
  )
}