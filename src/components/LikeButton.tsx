'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { getCurrentUser } from '@/lib/simple-auth'

interface LikeButtonProps {
  postId: string
  initialLikes: number
  initialDislikes: number
  initialUserLike?: boolean | null // true = liked, false = disliked, null = no action
  size?: 'sm' | 'default' | 'lg'
  showCounts?: boolean
}

export function LikeButton({
  postId,
  initialLikes,
  initialDislikes,
  initialUserLike = null,
  size = 'default',
  showCounts = true
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [userLike, setUserLike] = useState<boolean | null>(initialUserLike)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      // localStorage에서 사용자의 좋아요 상태 복원
      const userLikes = JSON.parse(localStorage.getItem(`userLikes_${user.id}`) || '{}')
      if (userLikes[postId] !== undefined) {
        setUserLike(userLikes[postId])
      }
    }
  }, [postId])

  const handleLikeDislike = async (isLike: boolean) => {
    const user = getCurrentUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    // 현재 상태 저장 (실패 시 복원용)
    const previousLikes = likes
    const previousDislikes = dislikes
    const previousUserLike = userLike

    // 낙관적 업데이트: 즉시 UI 업데이트
    let newUserLike: boolean | null = null
    let newLikes = likes
    let newDislikes = dislikes

    if (isLike) {
      if (userLike === true) {
        // 이미 좋아요 상태면 취소
        newUserLike = null
        newLikes = Math.max(0, likes - 1)
      } else {
        // 좋아요 추가
        newUserLike = true
        newLikes = likes + 1
        if (userLike === false) {
          // 싫어요에서 좋아요로 변경
          newDislikes = Math.max(0, dislikes - 1)
        }
      }
    } else {
      if (userLike === false) {
        // 이미 싫어요 상태면 취소
        newUserLike = null
        newDislikes = Math.max(0, dislikes - 1)
      } else {
        // 싫어요 추가
        newUserLike = false
        newDislikes = dislikes + 1
        if (userLike === true) {
          // 좋아요에서 싫어요로 변경
          newLikes = Math.max(0, likes - 1)
        }
      }
    }

    setLikes(newLikes)
    setDislikes(newDislikes)
    setUserLike(newUserLike)

    // localStorage에 즉시 저장
    const userLikes = JSON.parse(localStorage.getItem(`userLikes_${user.id}`) || '{}')
    userLikes[postId] = newUserLike
    localStorage.setItem(`userLikes_${user.id}`, JSON.stringify(userLikes))

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          isLike
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '좋아요/싫어요 처리에 실패했습니다.')
      }

      // 서버 응답으로 정확한 값 업데이트
      setLikes(result.likes)
      setDislikes(result.dislikes)
      setUserLike(result.userLike)
      
      // localStorage 재저장
      userLikes[postId] = result.userLike
      localStorage.setItem(`userLikes_${user.id}`, JSON.stringify(userLikes))
    } catch (error) {
      console.error('Like/dislike error:', error)
      
      // 실패 시 이전 상태로 복원
      setLikes(previousLikes)
      setDislikes(previousDislikes)
      setUserLike(previousUserLike)
      
      const userLikes = JSON.parse(localStorage.getItem(`userLikes_${user.id}`) || '{}')
      userLikes[postId] = previousUserLike
      localStorage.setItem(`userLikes_${user.id}`, JSON.stringify(userLikes))
      
      alert('좋아요/싫어요 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSizeClass = {
    sm: 'h-8 px-2',
    default: 'h-9 px-3',
    lg: 'h-10 px-4'
  }[size]

  const iconSizeClass = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size]

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userLike === true ? 'default' : 'outline'}
        size={size}
        onClick={() => handleLikeDislike(true)}
        disabled={isLoading}
        className={`${buttonSizeClass} ${
          userLike === true 
            ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500' 
            : 'hover:bg-blue-50 hover:border-blue-200'
        }`}
      >
        <ThumbsUp className={`${iconSizeClass} ${userLike === true ? 'fill-current' : ''}`} />
        {showCounts && <span className="ml-1">{likes}</span>}
      </Button>
      
      <Button
        variant={userLike === false ? 'default' : 'outline'}
        size={size}
        onClick={() => handleLikeDislike(false)}
        disabled={isLoading}
        className={`${buttonSizeClass} ${
          userLike === false 
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
            : 'hover:bg-red-50 hover:border-red-200'
        }`}
      >
        <ThumbsDown className={`${iconSizeClass} ${userLike === false ? 'fill-current' : ''}`} />
        {showCounts && <span className="ml-1">{dislikes}</span>}
      </Button>
    </div>
  )
}